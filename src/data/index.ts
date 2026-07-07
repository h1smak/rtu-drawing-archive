import studentsJson from '@/data/students.json'
import teachersJson from '@/data/teachers.json'
import studyTasksJson from '@/data/studyTasks.json'
import eventsJson from '@/data/events.json'
import exhibitionsJson from '@/data/exhibitions.json'
import studyTasksTreeJson from '@/data/studyTasksTree.json'

import type {
  ArchiveCollections,
  Exhibition,
  HistoricalEvent,
  Student,
  StudyTaskItem,
  StudyTaskTreeNode,
  Teacher,
} from '@/types/archive'

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

// Future-proofing: swapping JSON for REST should only change this file.
export const archiveApi = {
  async getCollections(): Promise<ArchiveCollections> {
    // Simulated latency so skeletons make sense.
    await delay(350)

    const students = studentsJson.map((student) => ({
      ...student,
      keywords: student.keywords,
    })) as Student[]
    const teachers = teachersJson.map((teacher) => ({
      ...teacher,
      keywords: teacher.keywords,
    })) as Teacher[]

    return {
      students,
      teachers,
      studyTasks: studyTasksJson as StudyTaskItem[],
      events: eventsJson as HistoricalEvent[],
      exhibitions: exhibitionsJson as Exhibition[],
      studyTasksTree: studyTasksTreeJson as StudyTaskTreeNode,
    }
  },
}

