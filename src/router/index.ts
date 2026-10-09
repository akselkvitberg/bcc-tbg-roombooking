import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import PlaceholderPage from '@/components/PlaceholderPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** i18n-nøkkel for sidetittel */
    titleKey: string
    /** Hvilket menypunkt som er aktivt */
    navKey?: NavKey
  }
}

export type NavKey = 'book' | 'dayView' | 'map' | 'myBookings' | 'requests' | 'allBookings' | 'roomsAndAccess'

// Tomme skjermer for fasene i docs/plan.md. Byttes ut med ekte sider i features/ fase for fase.
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'book', component: PlaceholderPage, meta: { titleKey: 'pages.book', navKey: 'book' } },
  { path: '/rom/:roomId', name: 'room', component: PlaceholderPage, meta: { titleKey: 'pages.room', navKey: 'book' } },
  {
    path: '/book/detaljer',
    name: 'details',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.details', navKey: 'book' },
  },
  {
    path: '/book/kvittering',
    name: 'receipt',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.receipt', navKey: 'book' },
  },
  {
    path: '/bygg/:partId',
    name: 'wholePart',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.wholePart', navKey: 'book' },
  },
  { path: '/kart', name: 'map', component: PlaceholderPage, meta: { titleKey: 'pages.map', navKey: 'map' } },
  {
    path: '/dagsoversikt',
    name: 'dayView',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.dayView', navKey: 'dayView' },
  },
  {
    path: '/mine',
    name: 'myBookings',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.myBookings', navKey: 'myBookings' },
  },
  {
    path: '/admin/foresporsler',
    name: 'requests',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.requests', navKey: 'requests' },
  },
  {
    path: '/admin/bookinger',
    name: 'allBookings',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.allBookings', navKey: 'allBookings' },
  },
  {
    path: '/admin/rom',
    name: 'roomsAndAccess',
    component: PlaceholderPage,
    meta: { titleKey: 'pages.roomsAndAccess', navKey: 'roomsAndAccess' },
  },
  {
    path: '/demo',
    name: 'demo',
    component: () => import('@/features/demo/DemoPage.vue'),
    meta: { titleKey: 'pages.demo' },
  },
  { path: '/:pathMatch(.*)*', name: 'notFound', component: PlaceholderPage, meta: { titleKey: 'pages.notFound' } },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
