import type { InjectionKey, Ref } from 'vue'
import type { LoCha } from '@/types'

export const REASON_COLLAPSED_KEY: InjectionKey<boolean> = Symbol('reasonCollapsed')
export const LOCHA_KEY: InjectionKey<LoCha> = Symbol('loCha')
export const LOCHA_INSTANCE_ID_KEY: InjectionKey<string> = Symbol('loChaInstanceId')
export const MAP_STYLE_URL_KEY: InjectionKey<string> = Symbol('mapStyleUrl')
export const MAP_LOCALE_KEY: InjectionKey<Ref<Record<string, string> | undefined>> = Symbol('mapLocale')
