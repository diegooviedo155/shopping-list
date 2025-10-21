export interface AccessRequest {
  id: string
  list_owner_id: string
  requester_id?: string
  requester_email: string
  requester_name?: string
  list_name: string
  status: 'pending' | 'approved' | 'rejected'
  message?: string
  created_at: string
  updated_at: string
  approved_at?: string
  rejected_at?: string
}

export interface SharedListAccess {
  id: string
  list_owner_id: string
  member_id: string
  list_name: string
  granted_at: string
}

export interface CreateAccessRequestData {
  list_owner_id: string
  requester_email: string
  requester_name?: string
  list_name?: string
  message?: string
}

export interface UpdateAccessRequestData {
  status: 'approved' | 'rejected'
}

export interface AccessRequestWithOwner {
  id: string
  list_owner_id: string
  requester_id?: string
  requester_email: string
  requester_name?: string
  list_name: string
  status: 'pending' | 'approved' | 'rejected'
  message?: string
  created_at: string
  updated_at: string
  approved_at?: string
  rejected_at?: string
  owner_email?: string
  owner_name?: string
}
