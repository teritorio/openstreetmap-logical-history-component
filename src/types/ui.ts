export interface FormData {
  dateStart: string
  dateEnd?: string
  bbox: string
  includeRelationTypeRoute?: boolean
}

export interface Preset extends FormData {
  title: string
}

export type ErrorType = 'error' | 'warning' | 'success' | 'info'

export interface Error {
  message?: string
  type: ErrorType
}
