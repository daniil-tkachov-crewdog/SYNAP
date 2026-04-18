import type { PendingRequest, TabRecord, AIProvider } from '@synap/types'

// All state lives in chrome.storage.session so it survives service worker termination.

const KEYS = {
  pendingRequests: 'pending_requests',
  tabRecords: 'tab_records',
} as const

async function getAll<T>(key: string): Promise<Record<string, T>> {
  const result = await chrome.storage.session.get(key)
  return (result[key] as Record<string, T>) ?? {}
}

async function setAll<T>(key: string, data: Record<string, T>): Promise<void> {
  await chrome.storage.session.set({ [key]: data })
}

// ─── Pending Requests ─────────────────────────────────────────────────────────

export async function getPendingRequest(requestId: string): Promise<PendingRequest | null> {
  const all = await getAll<PendingRequest>(KEYS.pendingRequests)
  return all[requestId] ?? null
}

export async function setPendingRequest(request: PendingRequest): Promise<void> {
  const all = await getAll<PendingRequest>(KEYS.pendingRequests)
  all[request.requestId] = request
  await setAll(KEYS.pendingRequests, all)
}

export async function updatePendingRequest(
  requestId: string,
  patch: Partial<PendingRequest>
): Promise<void> {
  const all = await getAll<PendingRequest>(KEYS.pendingRequests)
  if (all[requestId]) {
    all[requestId] = { ...all[requestId]!, ...patch }
    await setAll(KEYS.pendingRequests, all)
  }
}

export async function deletePendingRequest(requestId: string): Promise<void> {
  const all = await getAll<PendingRequest>(KEYS.pendingRequests)
  delete all[requestId]
  await setAll(KEYS.pendingRequests, all)
}

// ─── Tab Records ──────────────────────────────────────────────────────────────

export async function getTabRecord(aiProvider: AIProvider): Promise<TabRecord | null> {
  const all = await getAll<TabRecord>(KEYS.tabRecords)
  const entry = Object.values(all).find((r) => r.aiProvider === aiProvider)
  return entry ?? null
}

export async function setTabRecord(record: TabRecord): Promise<void> {
  const all = await getAll<TabRecord>(KEYS.tabRecords)
  all[String(record.tabId)] = record
  await setAll(KEYS.tabRecords, all)
}

export async function deleteTabRecord(tabId: number): Promise<void> {
  const all = await getAll<TabRecord>(KEYS.tabRecords)
  delete all[String(tabId)]
  await setAll(KEYS.tabRecords, all)
}

export async function getAllTabRecords(): Promise<TabRecord[]> {
  const all = await getAll<TabRecord>(KEYS.tabRecords)
  return Object.values(all)
}

export async function updateTabStatus(tabId: number, status: TabRecord['status']): Promise<void> {
  const all = await getAll<TabRecord>(KEYS.tabRecords)
  if (all[String(tabId)]) {
    all[String(tabId)]!.status = status
    await setAll(KEYS.tabRecords, all)
  }
}
