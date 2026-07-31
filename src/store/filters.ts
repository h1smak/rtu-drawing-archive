import { create } from 'zustand'

import type { EntityType } from '@/types/archive'
import type {
  StudentCategory,
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
  selectedStudyTaskNodeIds: string[]
  studentCategory: StudentCategory
  focusPerson: FocusPerson
  darkMode: boolean

  setEntityType: (t: EntityType) => void
  setTimeline: (t: TimelineFilter) => void
  setQuery: (q: string) => void
  setAlphabet: (a: string | null) => void
  toggleStudyTaskNode: (id: string) => void
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
  selectedStudyTaskNodeIds: [] as string[],
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
      studentCategory: t === 'teachers' ? null : s.studentCategory,
    }))
  },
  setTimeline: (t) => set({ timeline: t }),
  setQuery: (q) => set({ query: q }),
  setAlphabet: (a) => set({ alphabet: a }),

  toggleStudyTaskNode: (id) =>
    set((s) => {
      const has = s.selectedStudyTaskNodeIds.includes(id)
      return {
        selectedStudyTaskNodeIds: has
          ? s.selectedStudyTaskNodeIds.filter((x) => x !== id)
          : [...s.selectedStudyTaskNodeIds, id],
      }
    }),

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
      studentCategory: null,
    })),
  clearFocusPerson: () => set({ focusPerson: null }),

  resetAll: () => set({ ...defaultState, darkMode: get().darkMode }),

  toggleDarkMode: () =>
    set((s) => ({
      darkMode: !s.darkMode,
    })),
}))

