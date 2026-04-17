export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken?: string
  tokenType?: string
  userId: number
  username: string
  email: string
  role: string
  employeeName?: string | null
}

export interface AuthUser {
  userId: number
  username: string
  email: string
  role: string
  employeeName?: string | null
}
