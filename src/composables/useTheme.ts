import { ref, watchEffect } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage kan være blokkert
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<Theme>(initialTheme())

watchEffect(() => {
  // BCC-biblioteket bytter til mørk modus med klassen .dark på <html>
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
})

/** Lys/mørk modus, delt i hele appen og husket mellom besøk. */
export function useTheme() {
  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(STORAGE_KEY, theme.value)
    } catch {
      // ignorer
    }
  }
  return { theme, toggle }
}
