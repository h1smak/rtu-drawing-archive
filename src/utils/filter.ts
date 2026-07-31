import type {
  ArchiveCollections,
  EntityType,
  Searchable,
  Person,
  Project,
} from '@/types/archive'
import { matchesGlobalSearch } from '@/utils/search'
import { collectDescendantTitles, findNodeById } from '@/utils/studyTasksTree'
import {
  sortEvents,
  sortExhibitions,
  sortPeople,
  sortProjects,
} from '@/utils/sort'

export type TimelineFilter =
  | { kind: 'all' }
  | { kind: 'decade'; decade: number }
  | { kind: 'year'; year: number }

export type StudentCategory = 'graduated' | 'undergraduate' | null

export type FilterStateSnapshot = {
  entityType: EntityType
  timeline: TimelineFilter
  query: string
  alphabet: string | null
  selectedStudyTaskNodeIds: Set<string>
  studentCategory: StudentCategory
  focusPerson?: { kind: 'person'; id: string } | null
}

export type FilteredResults = {
  people: Person[] // kept for backwards compatibility but not rendered as cards
  projects: Project[]
  events: ArchiveCollections['events']
  exhibitions: ArchiveCollections['exhibitions']
  total: number
}

function includesTimeline(
  item: Searchable,
  timeline: TimelineFilter,
): boolean {
  if (timeline.kind === 'all') return true
  if (timeline.kind === 'decade') {
    return 'decade' in item && item.decade === timeline.decade
  }
  if ('year' in item) return item.year === timeline.year
  if ('decade' in item) return item.decade === Math.floor(timeline.year / 10) * 10
  return true
}

function matchesStudyTaskTree(
  item: Searchable,
  collections: ArchiveCollections,
  selectedNodeIds: Set<string>,
): boolean {
  if (selectedNodeIds.size === 0) return true

  const titles = new Set<string>()
  for (const id of selectedNodeIds) {
    const node = findNodeById(collections.studyTasksTree, id)
    if (!node) continue
    for (const t of collectDescendantTitles(node)) titles.add(t)
  }

  if (item.type === 'project')
    return (item.category ? titles.has(item.category) : false) || (item.subcategory ? titles.has(item.subcategory) : false)

  return true
}

function matchesPeopleCategories(
  item: Searchable,
  state: FilterStateSnapshot,
  collections: ArchiveCollections
): boolean {
  if (state.entityType === 'all') return true

  if (item.type === 'project') {
    const author = collections.people.find(p => p.id === item.authorId)
    if (!author) return false

    if (state.entityType === 'teachers' && !author.roles.includes('teacher')) return false
    
    if (state.entityType === 'students') {
      if (!author.roles.includes('student')) return false
      if (state.studentCategory && author.status !== state.studentCategory) return false
    }
    return true
  }
  
  if (item.type === 'event' || item.type === 'exhibition') {
    // Usually don't show events/exhibitions when a specific people tab is selected
    return false
  }

  return true
}

function matchesAlphabet(item: Searchable, alphabet: string | null, collections: ArchiveCollections): boolean {
  if (!alphabet) return true
  if (item.type === 'project') {
    const author = collections.people.find(p => p.id === item.authorId)
    if (!author) return false
    const first = author.lastName[0]?.toLocaleUpperCase() ?? ''
    return first === alphabet
  }
  return true
}

export function filterCollections(
  collections: ArchiveCollections,
  state: FilterStateSnapshot,
): FilteredResults {
  const basePred = (item: Searchable) =>
    includesTimeline(item, state.timeline) &&
    matchesGlobalSearch(item, state.query) &&
    matchesStudyTaskTree(item, collections, state.selectedStudyTaskNodeIds) &&
    matchesPeopleCategories(item, state, collections) &&
    matchesAlphabet(item, state.alphabet, collections)

  const focus = state.focusPerson ?? null

  const projectsRaw = collections.projects.filter(basePred).sort(sortProjects)
  const eventsRaw = state.entityType === 'all' ? collections.events.filter(basePred).sort(sortEvents) : []
  const exhibitionsRaw = state.entityType === 'all' ? collections.exhibitions.filter(basePred).sort(sortExhibitions) : []

  // Focus mode overrides list
  const projects = focus
    ? collections.projects.filter((st) => st.authorId === focus.id || st.teacherId === focus.id).sort(sortProjects)
    : projectsRaw

  const events = focus ? [] : eventsRaw
  const exhibitions = focus ? [] : exhibitionsRaw

  const total = projects.length + events.length + exhibitions.length

  return { people: [], projects, events, exhibitions, total }
}

