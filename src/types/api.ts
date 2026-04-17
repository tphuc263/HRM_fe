export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ApiErrorPayload {
  success: boolean
  message: string
  data?: Record<string, string>
}

export interface PageData<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}
