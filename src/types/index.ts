export interface FormData {
  dateStart: string
  dateEnd: string
  bbox: string
}

export type ErrorType = 'error' | 'warning' | 'success' | 'info'

export interface Error {
  message?: string
  type: ErrorType
}
