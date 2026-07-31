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

export function matchesGlobalSearch(item: Searchable, query: string, collections?: import('@/types/archive').ArchiveCollections): boolean {
  const q = normalize(query)
  if (!q) return true

  const haystackParts: string[] = []

  if ('title' in item) haystackParts.push(item.title)
  if ('description' in item && item.description) haystackParts.push(item.description)
  if ('year' in item && item.year) haystackParts.push(String(item.year))

  if (item.type === 'project') {
    if (item.studyTheme) haystackParts.push(item.studyTheme)
    if (item.keyword) haystackParts.push(item.keyword)
    if (item.category) haystackParts.push(item.category)
    if (item.subcategory) haystackParts.push(item.subcategory)

    if (collections) {
      const author = collections.people.find(p => p.id === item.authorId)
      if (author) {
        haystackParts.push(author.firstName, author.lastName)
        if (author.description) haystackParts.push(author.description)
        if (author.keywords) haystackParts.push(toText(author.keywords))
        if (author.position) haystackParts.push(author.position)
        if (author.specialization) haystackParts.push(author.specialization)
      }
      
      if (item.teacherId) {
        const teacher = collections.people.find(p => p.id === item.teacherId)
        if (teacher) {
          haystackParts.push(teacher.firstName, teacher.lastName)
        }
      }
    }
  }

  if (item.type === 'person') {
    haystackParts.push(item.firstName, item.lastName)
    if (item.lifeYears) haystackParts.push(item.lifeYears)
    if (item.description) haystackParts.push(item.description)
    if (item.keywords) haystackParts.push(toText(item.keywords))
    if (item.position) haystackParts.push(item.position)
    if (item.specialization) haystackParts.push(item.specialization)
  }

  const haystack = normalize(haystackParts.join(' '))
  return haystack.includes(q)
}

