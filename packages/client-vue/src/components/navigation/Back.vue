<template>
  <RouterLink :to="{ name: 'basket' }" tabindex="-1">
    <Button
      v-bind="$attrs"
      size="sm"
      variant="tonal"
      :label="t('navigation.back')"
    >
      <template #prepend><Icon icon="arrow-left" size="2xs" /></template>
    </Button>
  </RouterLink>
</template>

<script lang="ts" setup>
import { Button, Icon } from "@upmind-automation/upmind-ui";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>
