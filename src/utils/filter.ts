import type {
  ArchiveCollections,
  EntityType,
  Searchable,
  Person,
  Project,
  StudyTaskTreeNode,
} from '@/types/archive'
import { matchesGlobalSearch } from '@/utils/search'
import { findNodeById } from '@/utils/studyTasksTree'
import { sortEvents, sortExhibitions, sortProjects } from '@/utils/sort'

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

function findPathToTitle(node: StudyTaskTreeNode, targetTitle: string, currentPath: string[]): string[] | null {
  const newPath = [...currentPath, node.id]
  if (node.title === targetTitle) return newPath
  
  if (node.children) {
    for (const child of node.children) {
      const found = findPathToTitle(child, targetTitle, newPath)
      if (found) return found
    }
  }
  return null
}

function getProjectTreePathIds(project: Project, root: StudyTaskTreeNode): Set<string> {
  const pathIds = new Set<string>()
  
  // Find top-level keyword branch
  const keywordNode = root.children?.find(c => c.title === project.keyword || c.keyword === project.keyword)
  if (!keywordNode) return pathIds
  
  pathIds.add(keywordNode.id)
  
  let catPath: string[] | null = null
  if (project.category) {
    catPath = findPathToTitle(keywordNode, project.category, [])
  }
  
  if (catPath) {
    for (const id of catPath) pathIds.add(id)
    
    if (project.subcategory) {
       const catNodeId = catPath[catPath.length - 1]
       const catNode = findNodeById(keywordNode, catNodeId)
       if (catNode) {
          const subCatPath = findPathToTitle(catNode, project.subcategory, [])
          if (subCatPath) {
             for (const id of subCatPath) pathIds.add(id)
          }
       }
    }
  }
  
  return pathIds
}

function matchesStudyTaskTree(
  item: Searchable,
  collections: ArchiveCollections,
  selectedNodeIds: Set<string>,
): boolean {
  if (selectedNodeIds.size === 0) return true

  if (item.type === 'project') {
    const pathIds = getProjectTreePathIds(item, collections.studyTasksTree)
    for (const selectedId of selectedNodeIds) {
      if (pathIds.has(selectedId)) return true
    }
    return false
  }

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
  const focus = state.focusPerson ?? null

  const basePred = (item: Searchable) =>
    includesTimeline(item, state.timeline) &&
    matchesGlobalSearch(item, state.query, collections) &&
    matchesStudyTaskTree(item, collections, state.selectedStudyTaskNodeIds) &&
    (focus ? true : matchesPeopleCategories(item, state, collections)) &&
    (focus ? true : matchesAlphabet(item, state.alphabet, collections))

  const projectsRaw = collections.projects.filter(basePred).sort(sortProjects)
  
  // Events and Exhibitions are only shown if entityType is 'all' (or if we are in focus mode? 
  // Wait, if focus is active, they shouldn't show anyway, see below).
  const eventsRaw = state.entityType === 'all' ? collections.events.filter(basePred).sort(sortEvents) : []
  const exhibitionsRaw = state.entityType === 'all' ? collections.exhibitions.filter(basePred).sort(sortExhibitions) : []

  // Focus mode overrides list
  const projects = focus
    ? projectsRaw.filter((st) => st.authorId === focus.id)
    : projectsRaw

  const events = focus ? [] : eventsRaw
  const exhibitions = focus ? [] : exhibitionsRaw

  const total = projects.length + events.length + exhibitions.length

  return { people: [], projects, events, exhibitions, total }
}
