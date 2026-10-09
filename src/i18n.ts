import { createI18n } from 'vue-i18n'
import nb from './locales/nb.json'

export type MessageSchema = typeof nb

export const i18n = createI18n<[MessageSchema], 'nb'>({
  legacy: false,
  locale: 'nb',
  fallbackLocale: 'nb',
  messages: { nb },
})
