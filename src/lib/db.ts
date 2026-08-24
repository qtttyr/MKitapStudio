import { openDB, type IDBPDatabase } from 'idb'
import type { Project } from '../types'

const DB_NAME = 'mkstudio'
const DB_VERSION = 1

type StudioDB = {
  projects: { key: string; value: Project }
}

let dbPromise: Promise<IDBPDatabase<StudioDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<StudioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

/**
 * Просим постоянное хранилище — без этого браузер/iOS могут вычистить
 * IndexedDB при нехватке места. Рукописи должны пережить всё.
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist()
  } catch {
    /* не поддерживается — молча игнорируем */
  }
}

export const dbProjects = {
  async all(): Promise<Project[]> {
    const list = await (await getDb()).getAll('projects')
    return list.sort((a, b) => b.updatedAt - a.updatedAt)
  },
  async get(id: string): Promise<Project | undefined> {
    return (await getDb()).get('projects', id)
  },
  async put(project: Project): Promise<void> {
    await (await getDb()).put('projects', project)
  },
  async remove(id: string): Promise<void> {
    await (await getDb()).delete('projects', id)
  },
  async clear(): Promise<void> {
    await (await getDb()).clear('projects')
  },
}
