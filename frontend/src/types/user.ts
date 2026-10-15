export interface UserPublic {
  id: number
  name: string
  email: string
  programme: string | null
  university: string | null
  semester: number | null
  phone: string | null
  bio: string | null
  career_goal: string | null
}

export interface UserProfile extends UserPublic {
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: UserPublic
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  programme?: string
  university?: string
  semester?: number
}

export interface LoginPayload {
  email: string
  password: string
}

export interface UserUpdatePayload {
  name?: string
  programme?: string
  university?: string
  semester?: number
  phone?: string
  bio?: string
  career_goal?: string
}
