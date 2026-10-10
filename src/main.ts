import { BccComponentLibrary } from '@bcc-code/component-library-vue'
import '@bcc-code/component-library-vue/style.css'
import '@bcc-code/component-library-vue/archivo-font.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'
import './styles/main.css'

createApp(App).use(BccComponentLibrary).use(createPinia()).use(i18n).use(router).mount('#app')
