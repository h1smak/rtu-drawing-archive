export type EntityType = 'all' | 'students' | 'teachers'

export type Keywords =
  | 'Architecture'
  | 'Art'
  | 'Historical events'
  | 'Exhibitions'

export type StudentStatus = 'graduated' | 'undergraduate'

export type Student = {
  id: number
  type: 'student'
  firstName: string
  lastName: string
  lifeYears: string
  graduatedYear: number
  status: StudentStatus
  studyPeriod: string
  decade: number
  image: string
  description: string
  keywords: Keywords[]
  studyTasks: string[]
}

export type Teacher = {
  id: number
  type: 'teacher'
  firstName: string
  lastName: string
  lifeYears: string
  position: string
  specialization: 'Architecture' | 'Art'
  appointedYear: number
  decade: number
  image: string
  description: string
  keywords: Keywords[]
}

export type StudyTaskItem = {
  id: number
  type: 'studyTask'
  title: string
  category: string
  subcategory: string | null
  decade: number
  studentId: number
  teacherId: number
  image: string
  description: string
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
  students: Student[]
  teachers: Teacher[]
  studyTasks: StudyTaskItem[]
  events: HistoricalEvent[]
  exhibitions: Exhibition[]
  studyTasksTree: StudyTaskTreeNode
}

export type Searchable =
  | Student
  | Teacher
  | StudyTaskItem
  | HistoricalEvent
  | Exhibition

