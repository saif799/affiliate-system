export type UserStatus = 'active' | 'suspended' | 'pending'

export interface JoinRequest {
  id: string
  name: string
  businessName: string
  email: string
  phone: string
  wilaya: string
  category: string
  requestedAt: string
  extraFields?: { label: string; value: string }[]
}