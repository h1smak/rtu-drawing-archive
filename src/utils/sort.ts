import type {
  Exhibition,
  HistoricalEvent,
  Person,
  Project,
} from '@/types/archive'

export function sortPeople(a: Person, b: Person) {
  return a.lastName.localeCompare(b.lastName, 'lv')
}

export function sortProjects(a: Project, b: Project) {
  // Newest first within decade, then title
  const decadeA = a.decade ?? 0
  const decadeB = b.decade ?? 0
  return decadeB - decadeA || a.title.localeCompare(b.title, 'lv')
}

export function sortEvents(a: HistoricalEvent, b: HistoricalEvent) {
  return b.year - a.year
}

export function sortExhibitions(a: Exhibition, b: Exhibition) {
  return b.year - a.year
}

