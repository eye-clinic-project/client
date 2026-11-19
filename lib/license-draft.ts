const DATABASE = "retinacare"
const STORE = "license-drafts"

export interface LicenseDraft {
  email: string
  licenseNumber: string
  documents: File[]
  savedAt: number
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "email" })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const database = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(
        database.transaction(STORE, mode).objectStore(STORE)
      )
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}

const key = (email: string) => email.trim().toLowerCase()

export async function saveLicenseDraft(
  draft: Omit<LicenseDraft, "savedAt">
): Promise<boolean> {
  try {
    await run("readwrite", (store) =>
      store.put({ ...draft, email: key(draft.email), savedAt: Date.now() })
    )
    return true
  } catch {
    return false
  }
}

export async function readLicenseDraft(
  email: string
): Promise<LicenseDraft | null> {
  try {
    const draft = await run<LicenseDraft | undefined>("readonly", (store) =>
      store.get(key(email))
    )
    return draft ?? null
  } catch {
    return null
  }
}

export async function deleteLicenseDraft(email: string): Promise<void> {
  try {
    await run("readwrite", (store) => store.delete(key(email)))
  } catch {
    return
  }
}
