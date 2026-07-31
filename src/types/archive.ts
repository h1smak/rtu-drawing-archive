export type EntityType = 'all' | 'students' | 'teachers'

export type Keywords =
  | 'Architecture'
  | 'Art'
  | 'Exhibitions'

export type StudentStatus = 'graduated' | 'undergraduate'
export type Role = 'student' | 'teacher'

export type Person = {
  id: string
  type: 'person'
  roles: Role[]
  firstName: string
  lastName: string
  lifeYears?: string
  decade?: number
  image?: string
  description?: string
  keywords?: Keywords[]
  
  // Student specific
  graduatedYear?: number
  status?: StudentStatus
  studyPeriod?: string
  
  // Teacher specific
  position?: string
  specialization?: 'Architecture' | 'Art'
  appointedYear?: number
}

export type Project = {
  id: string
  type: 'project'
  title: string
  description: string
  authorId: string
  teacherId?: string | null
  year?: number
  decade?: number
  images: string[]
  studyTheme: string
  keyword?: Keywords
  category?: string
  subcategory?: string | null
}

export type HistoricalEvent = {
  id: number
  type: 'event'
  title: string
  year: number
  decade: number
  description: string
  image: string
}

export type Exhibition = {
  id: number
  type: 'exhibition'
  title: string
  year: number
  description: string
  image: string
}

export type StudyTaskTreeNode = {
  id: string
  title: string
  children?: StudyTaskTreeNode[]
}

export type ArchiveCollections = {
  people: Person[]
  projects: Project[]
  events: HistoricalEvent[]
  exhibitions: Exhibition[]
  studyTasksTree: StudyTaskTreeNode
}

export type Searchable =
  | Person
  | Project
  | HistoricalEvent
  | Exhibition

