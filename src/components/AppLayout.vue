<script setup lang="ts">
import {
  BccAppNavigation,
  BccButton,
  BccTopNavigation,
  type BccAppNavigationItem,
} from '@bcc-code/component-library-vue'
import {
  AddCircleIcon,
  CalendarViewDayIcon,
  DarkModeIcon,
  EventNoteIcon,
  InboxIcon,
  LightModeIcon,
  MapIcon,
  MeetingRoomIcon,
  ViewTimelineIcon,
} from '@bcc-code/icons-vue'
import { computed, watchEffect, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import type { NavKey } from '@/router'

interface NavLink {
  key: NavKey
  to: string
  icon: Component
}

const { t } = useI18n()
const route = useRoute()
const { theme, toggle } = useTheme()

const mainLinks: NavLink[] = [
  { key: 'book', to: '/', icon: AddCircleIcon },
  { key: 'dayView', to: '/dagsoversikt', icon: CalendarViewDayIcon },
  { key: 'map', to: '/kart', icon: MapIcon },
  { key: 'myBookings', to: '/mine', icon: EventNoteIcon },
]
// Vises for romansvarlig og admin (spec §8.3). Rollene kommer i fase 1.
const adminLinks: NavLink[] = [
  { key: 'requests', to: '/admin/foresporsler', icon: InboxIcon },
  { key: 'allBookings', to: '/admin/bookinger', icon: ViewTimelineIcon },
  { key: 'roomsAndAccess', to: '/admin/rom', icon: MeetingRoomIcon },
]

// Mobil: Book / Mine bookinger / Kart (komponentkart.md)
const mobileItems = computed<BccAppNavigationItem[]>(() =>
  (['book', 'myBookings', 'map'] as const).map((key) => {
    const link = mainLinks.find((l) => l.key === key)!
    return { key, title: t(`nav.${key}`), icon: link.icon, to: link.to }
  }),
)

const activeKey = computed(() => route.meta.navKey ?? null)
// Før første navigasjon er ferdig har ruten ingen meta
const pageTitle = computed(() => (route.meta.titleKey ? t(route.meta.titleKey) : t('app.name')))

watchEffect(() => {
  document.title = `${pageTitle.value} – ${t('app.name')}`
})
</script>

<template>
  <div class="layout">
    <!-- BccTopNavigation gjør tittelen til sidens h1, så sidene har ikke egen h1 -->
    <BccTopNavigation class="top" :title="pageTitle" :subtitle="t('app.name')" hide-back title-left>
      <template #right>
        <BccButton
          :icon="theme === 'dark' ? LightModeIcon : DarkModeIcon"
          :aria-label="t('app.themeToggle')"
          class="theme-toggle"
          text
          rounded
          @click="toggle"
        />
      </template>
      <template #bottom>
        <div class="desktop-nav">
          <nav :aria-label="t('app.mainMenu')">
            <RouterLink
              v-for="link in mainLinks"
              :key="link.key"
              :to="link.to"
              class="nav-link"
              :class="{ active: activeKey === link.key }"
              :aria-current="activeKey === link.key ? 'page' : undefined"
            >
              <component :is="link.icon" class="nav-icon" aria-hidden="true" />
              {{ t(`nav.${link.key}`) }}
            </RouterLink>
          </nav>
          <nav :aria-label="t('app.adminMenu')" class="admin-nav">
            <span class="nav-group">{{ t('app.adminMenu') }}</span>
            <RouterLink
              v-for="link in adminLinks"
              :key="link.key"
              :to="link.to"
              class="nav-link"
              :class="{ active: activeKey === link.key }"
              :aria-current="activeKey === link.key ? 'page' : undefined"
            >
              <component :is="link.icon" class="nav-icon" aria-hidden="true" />
              {{ t(`nav.${link.key}`) }}
            </RouterLink>
          </nav>
        </div>
      </template>
    </BccTopNavigation>

    <main class="main">
      <RouterView />
    </main>

    <nav class="mobile-nav" :aria-label="t('app.mainMenu')">
      <BccAppNavigation :items="mobileItems" :link-component="RouterLink" :active-key="activeKey" />
    </nav>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.main {
  flex: 1;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 16px;
}
.desktop-nav {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px 8px;
}
.desktop-nav nav {
  display: flex;
  align-items: center;
  gap: 4px;
}
.nav-group {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  opacity: 0.85;
  margin-right: 4px;
}
/* Menyen ligger på toppfeltets farge, så alt bygger på currentColor derfra */
.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  font-weight: 500;
}
.nav-link:hover {
  background: color-mix(in srgb, currentColor 12%, transparent);
}
.nav-link.active {
  background: color-mix(in srgb, currentColor 18%, transparent);
  box-shadow: inset 0 -3px 0 currentColor;
}
.nav-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
.top :deep(.theme-toggle) {
  color: inherit;
}
.nav-icon {
  width: 20px;
  height: 20px;
}
.mobile-nav {
  position: sticky;
  bottom: 0;
}

@media (min-width: 1024px) {
  .main {
    padding: 24px;
  }
  .desktop-nav {
    display: flex;
  }
  .mobile-nav {
    display: none;
  }
}
</style>
