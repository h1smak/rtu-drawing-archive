import { create } from 'zustand'

import type { EntityType, Keywords } from '@/types/archive'
import type {
  StudentCategory,
  TeacherCategory,
  TimelineFilter,
} from '@/utils/filter'

export type FocusPerson =
  | { kind: 'student'; id: number }
  | { kind: 'teacher'; id: number }
  | null

type FiltersStore = {
  entityType: EntityType
  timeline: TimelineFilter
  query: string
  alphabet: string | null
  keywords: Keywords[]
  selectedStudyTaskNodeIds: string[]
  teacherCategory: TeacherCategory
  studentCategory: StudentCategory
  focusPerson: FocusPerson
  darkMode: boolean

  setEntityType: (t: EntityType) => void
  setTimeline: (t: TimelineFilter) => void
  setQuery: (q: string) => void
  setAlphabet: (a: string | null) => void
  toggleKeyword: (keyword: Keywords) => void
  clearKeywords: () => void
  toggleStudyTaskNode: (id: string) => void
  setTeacherCategory: (cat: TeacherCategory) => void
  setStudentCategory: (cat: StudentCategory) => void
  focusOnPerson: (p: Exclude<FocusPerson, null>) => void
  clearFocusPerson: () => void
  resetAll: () => void
  toggleDarkMode: () => void
}

const defaultState = {
  entityType: 'all' as const,
  timeline: { kind: 'all' } as TimelineFilter,
  query: '',
  alphabet: null as string | null,
  keywords: [] as Keywords[],
  selectedStudyTaskNodeIds: [] as string[],
  teacherCategory: null as TeacherCategory,
  studentCategory: null as StudentCategory,
  focusPerson: null as FocusPerson,
  darkMode: false,
}

export const useFiltersStore = create<FiltersStore>((set, get) => ({
  ...defaultState,

  setEntityType: (t) => {
    // Important rule: switching to Students hides teacher filters and vice versa.
    set((s) => ({
      ...s,
      entityType: t,
      alphabet: t === 'all' ? null : s.alphabet,
      teacherCategory: t === 'students' ? null : s.teacherCategory,
      studentCategory: t === 'teachers' ? null : s.studentCategory,
    }))
  },
  setTimeline: (t) => set({ timeline: t }),
  setQuery: (q) => set({ query: q }),
  setAlphabet: (a) => set({ alphabet: a }),

  toggleKeyword: (keyword) =>
    set((s) => {
      const has = s.keywords.includes(keyword)
      const keywords = has
        ? s.keywords.filter((t) => t !== keyword)
        : [...s.keywords, keyword]
      return { keywords }
    }),
  clearKeywords: () => set({ keywords: [] }),

  toggleStudyTaskNode: (id) =>
    set((s) => {
      const has = s.selectedStudyTaskNodeIds.includes(id)
      return {
        selectedStudyTaskNodeIds: has
          ? s.selectedStudyTaskNodeIds.filter((x) => x !== id)
          : [...s.selectedStudyTaskNodeIds, id],
      }
    }),

  setTeacherCategory: (cat) =>
    set((s) => ({
      teacherCategory: s.entityType === 'students' ? null : cat,
    })),
  setStudentCategory: (cat) =>
    set((s) => ({
      studentCategory: s.entityType === 'teachers' ? null : cat,
    })),

  focusOnPerson: (p) =>
    set((s) => ({
      ...s,
      focusPerson: p,
      entityType: 'all',
      alphabet: null,
      teacherCategory: null,
      studentCategory: null,
    })),
  clearFocusPerson: () => set({ focusPerson: null }),

  resetAll: () => set({ ...defaultState, darkMode: get().darkMode }),

  toggleDarkMode: () =>
    set((s) => ({
      darkMode: !s.darkMode,
    })),
}))

