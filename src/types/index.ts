export interface FormData {
  dateStart: string
  dateEnd?: string
  bbox: string
}

export interface FormDataApi {
  date_start: string
  date_end?: string
  bbox: string
}

export interface Preset extends FormData {
  title: string
}

export type ErrorType = 'error' | 'warning' | 'success' | 'info'

export interface Error {
  message?: string
  type: ErrorType
}
