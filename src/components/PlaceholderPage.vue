<script setup lang="ts">
import { BccMessage } from '@bcc-code/component-library-vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const route = useRoute()
const { t } = useI18n()
</script>

<template>
  <section class="page">
    <BccMessage severity="info" :message="t('placeholder.notBuilt')" />
    <RouterLink v-if="route.name === 'notFound'" to="/">{{ t('placeholder.toFrontPage') }}</RouterLink>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
