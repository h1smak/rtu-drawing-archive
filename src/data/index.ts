import peopleJson from '@/data/people.json'
import projectsJson from '@/data/projects.json'
import eventsJson from '@/data/events.json'
import exhibitionsJson from '@/data/exhibitions.json'
import studyTasksTreeJson from '@/data/studyTasksTree.json'

import type {
  ArchiveCollections,
  Exhibition,
  HistoricalEvent,
  Person,
  Project,
  StudyTaskTreeNode,
} from '@/types/archive'

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

// Future-proofing: swapping JSON for REST should only change this file.
export const archiveApi = {
  async getCollections(): Promise<ArchiveCollections> {
    // Simulated latency so skeletons make sense.
    await delay(350)

    const people = peopleJson as unknown as Person[]
    const projects = projectsJson as unknown as Project[]

    return {
      people,
      projects,
      events: eventsJson as HistoricalEvent[],
      exhibitions: exhibitionsJson as Exhibition[],
      studyTasksTree: studyTasksTreeJson as StudyTaskTreeNode,
    }
  },
}

