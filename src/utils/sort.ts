import type {
  Exhibition,
  HistoricalEvent,
  Student,
  StudyTaskItem,
  Teacher,
} from '@/types/archive'

export function sortStudents(a: Student, b: Student) {
  return a.lastName.localeCompare(b.lastName, 'lv')
}

export function sortTeachers(a: Teacher, b: Teacher) {
  return a.lastName.localeCompare(b.lastName, 'lv')
}

export function sortStudyTasks(a: StudyTaskItem, b: StudyTaskItem) {
  // Newest first within decade, then title
  return b.decade - a.decade || a.title.localeCompare(b.title, 'lv')
}

export function sortEvents(a: HistoricalEvent, b: HistoricalEvent) {
  return b.year - a.year
}

export function sortExhibitions(a: Exhibition, b: Exhibition) {
  return b.year - a.year
}

