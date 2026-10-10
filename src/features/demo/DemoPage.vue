<script setup lang="ts">
import { BccButton, BccMessage } from '@bcc-code/component-library-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <section class="page">
    <p>{{ t('demo.intro') }}</p>
    <div class="row">
      <BccButton :label="t('demo.primary')" />
      <BccButton :label="t('demo.secondary')" severity="secondary" />
      <BccButton :label="t('demo.text')" text />
      <BccButton :label="t('demo.danger')" severity="danger" />
    </div>
    <BccMessage severity="success" :title="t('demo.confirmedTitle')" :message="t('demo.confirmedBody')" />
    <BccMessage severity="warn" :title="t('demo.managerTitle')" :message="t('demo.managerBody')" />
    <BccMessage severity="error" :title="t('demo.errorTitle')" :message="t('demo.errorBody')" />
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
