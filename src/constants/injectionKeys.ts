import type { InjectionKey } from 'vue'
import type { LoCha } from '@/types'

export const REASON_COLLAPSED_KEY: InjectionKey<boolean> = Symbol('reasonCollapsed')
export const LOCHA_KEY: InjectionKey<LoCha> = Symbol('loCha')
export const LOCHA_INSTANCE_ID_KEY: InjectionKey<string> = Symbol('loChaInstanceId')
