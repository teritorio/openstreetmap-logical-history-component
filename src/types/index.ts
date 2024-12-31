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

export interface ACTION_COLORS {
  create: '#52c41a'
  delete: '#FF0000'
  update: '#F0F0F0'
}

export const actionColors = {
  create: '#52c41a',
  delete: '#FF0000',
  update: '#F0F0F0',
} satisfies ACTION_COLORS
