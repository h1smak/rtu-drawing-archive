import type {
  ArchiveCollections,
  EntityType,
  Keywords,
  Searchable,
  Student,
  StudyTaskItem,
  Teacher,
} from '@/types/archive'
import { matchesGlobalSearch } from '@/utils/search'
import { collectDescendantTitles, findNodeById } from '@/utils/studyTasksTree'
import {
  sortEvents,
  sortExhibitions,
  sortStudents,
  sortStudyTasks,
  sortTeachers,
} from '@/utils/sort'

export type TimelineFilter =
  | { kind: 'all' }
  | { kind: 'decade'; decade: number }
  | { kind: 'year'; year: number }

export type TeacherCategory = 'Architecture' | 'Art' | null
export type StudentCategory = 'graduated' | 'undergraduate' | null

export type FilterStateSnapshot = {
  entityType: EntityType
  timeline: TimelineFilter
  query: string
  alphabet: string | null
  keywords: Set<Keywords>
  selectedStudyTaskNodeIds: Set<string>
  teacherCategory: TeacherCategory
  studentCategory: StudentCategory
  focusPerson?: { kind: 'student'; id: number } | { kind: 'teacher'; id: number } | null
}

export type FilteredResults = {
  students: Student[]
  teachers: Teacher[]
  studyTasks: StudyTaskItem[]
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
  // year filter: events/exhibitions use year; others approximate by decade match.
  if ('year' in item) return item.year === timeline.year
  if ('decade' in item) return item.decade === Math.floor(timeline.year / 10) * 10
  return true
}

function matchesKeywords(item: Searchable, selected: Set<Keywords>): boolean {
  if (selected.size === 0) return true
  if ('keywords' in item) {
    return item.keywords.some((t) => selected.has(t))
  }
  // Non-keyword entities: allow through only if user did not filter to those keywords.
  return selected.size === 0
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

  if (item.type === 'student') return item.studyTasks.some((t) => titles.has(t))
  if (item.type === 'studyTask')
    return titles.has(item.category) || (item.subcategory ? titles.has(item.subcategory) : false)

  return true
}

function matchesPeopleCategories(
  item: Searchable,
  state: FilterStateSnapshot,
): boolean {
  if (item.type === 'teacher') {
    if (state.entityType !== 'teachers' && state.entityType !== 'all') return false
    if (state.teacherCategory) return item.specialization === state.teacherCategory
  }
  if (item.type === 'student') {
    if (state.entityType !== 'students' && state.entityType !== 'all') return false
    if (state.studentCategory) return item.status === state.studentCategory
  }
  return true
}

function matchesAlphabet(item: Searchable, alphabet: string | null): boolean {
  if (!alphabet) return true
  if (item.type !== 'student' && item.type !== 'teacher') return true
  const first = item.lastName[0]?.toLocaleUpperCase() ?? ''
  return first === alphabet
}

export function filterCollections(
  collections: ArchiveCollections,
  state: FilterStateSnapshot,
): FilteredResults {
  const basePred = (item: Searchable) =>
    includesTimeline(item, state.timeline) &&
    matchesGlobalSearch(item, state.query) &&
    matchesKeywords(item, state.keywords) &&
    matchesStudyTaskTree(item, collections, state.selectedStudyTaskNodeIds) &&
    matchesPeopleCategories(item, state) &&
    matchesAlphabet(item, state.alphabet)

  const focus = state.focusPerson ?? null

  const studentsRaw =
    state.entityType === 'teachers'
      ? []
      : collections.students.filter(basePred).sort(sortStudents)
  const teachersRaw =
    state.entityType === 'students'
      ? []
      : collections.teachers.filter(basePred).sort(sortTeachers)

  const studyTasksRaw =
    state.entityType === 'all'
      ? collections.studyTasks.filter(basePred).sort(sortStudyTasks)
      : []
  const eventsRaw =
    state.entityType === 'all'
      ? collections.events.filter(basePred).sort(sortEvents)
      : []
  const exhibitionsRaw =
    state.entityType === 'all'
      ? collections.exhibitions.filter(basePred).sort(sortExhibitions)
      : []

  // Focus mode: clicking a person shows only their works (study themes).
  const students =
    focus?.kind === 'student'
      ? studentsRaw.filter((s) => s.id === focus.id)
      : focus
        ? []
        : studentsRaw

  const teachers =
    focus?.kind === 'teacher'
      ? teachersRaw.filter((t) => t.id === focus.id)
      : focus
        ? []
        : teachersRaw

  const studyTasks =
    focus?.kind === 'student'
      ? studyTasksRaw.filter((st) => st.studentId === focus.id)
      : focus?.kind === 'teacher'
        ? studyTasksRaw.filter((st) => st.teacherId === focus.id)
        : studyTasksRaw

  const events = focus ? [] : eventsRaw
  const exhibitions = focus ? [] : exhibitionsRaw

  const total =
    students.length +
    teachers.length +
    studyTasks.length +
    events.length +
    exhibitions.length

  return { students, teachers, studyTasks, events, exhibitions, total }
}

