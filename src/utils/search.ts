import type { Searchable } from '@/types/archive'

function normalize(s: string) {
  return s
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

function toText(v: unknown): string {
  if (v == null) return ''
  if (Array.isArray(v)) return v.map(toText).join(' ')
  if (typeof v === 'object') return ''
  return String(v)
}

export function matchesGlobalSearch(item: Searchable, query: string): boolean {
  const q = normalize(query)
  if (!q) return true

  const haystackParts: string[] = []

  if ('firstName' in item) haystackParts.push(item.firstName, item.lastName, item.lifeYears)
  if ('title' in item) haystackParts.push(item.title)
  if ('description' in item) haystackParts.push(item.description)

  // Optional fields by type:
  if ('studyTasks' in item) haystackParts.push(toText(item.studyTasks))
  if ('keywords' in item) haystackParts.push(toText(item.keywords))
  if ('position' in item) haystackParts.push(item.position)
  if ('specialization' in item) haystackParts.push(item.specialization)
  if ('graduatedYear' in item) haystackParts.push(String(item.graduatedYear), item.studyPeriod)
  if ('appointedYear' in item) haystackParts.push(String(item.appointedYear))
  if ('year' in item) haystackParts.push(String(item.year))
  if ('category' in item) haystackParts.push(item.category, toText(item.subcategory))
  if ('teacherId' in item) haystackParts.push(String(item.teacherId))
  if ('studentId' in item) haystackParts.push(String(item.studentId))

  const haystack = normalize(haystackParts.join(' '))
  return haystack.includes(q)
}

