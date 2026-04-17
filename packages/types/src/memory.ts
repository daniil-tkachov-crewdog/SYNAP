export type MemoryCategory = 'personal' | 'preferences' | 'professional' | 'custom'

export interface MemoryFact {
  id: string
  userId: string
  category: MemoryCategory
  key: string
  value: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: string
  displayName: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}
