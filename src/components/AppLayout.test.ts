import { BccComponentLibrary } from '@bcc-code/component-library-vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppLayout from './AppLayout.vue'
import { i18n } from '@/i18n'
import { routes } from '@/router'

async function mountAt(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  return mount(AppLayout, { global: { plugins: [BccComponentLibrary, i18n, router] } })
}

describe('AppLayout', () => {
  it('viser hovedmeny og administrasjonsmeny med norsk tekst', async () => {
    const wrapper = await mountAt('/')
    const text = wrapper.text()
    for (const label of ['Book', 'Dagsoversikt', 'Kart', 'Mine bookinger', 'Forespørsler', 'Rom og tilgang']) {
      expect(text).toContain(label)
    }
  })

  it('markerer aktiv side med aria-current', async () => {
    const wrapper = await mountAt('/dagsoversikt')
    const current = wrapper.findAll('a[aria-current="page"]').map((a) => a.text())
    expect(current).toContain('Dagsoversikt')
  })

  it('viser tom skjerm med sidetittel for ruter som ikke er bygd', async () => {
    const wrapper = await mountAt('/admin/foresporsler')
    expect(wrapper.findAll('h1').map((h) => h.text())).toEqual(['Forespørsler'])
    expect(document.title).toBe('Forespørsler – Jarlsberg rombooking')
    expect(wrapper.text()).toContain('Denne skjermen er ikke bygd ennå.')
  })

  it('bytter til mørk modus med .dark på <html>', async () => {
    const wrapper = await mountAt('/')
    const before = document.documentElement.classList.contains('dark')
    await wrapper.get('button[aria-label="Bytt mellom lys og mørk modus"]').trigger('click')
    expect(document.documentElement.classList.contains('dark')).toBe(!before)
  })
})
