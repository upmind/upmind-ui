<template>
  <Button
    :as="RouterLink"
    :to="{ name: 'basket' }"
    tabindex="-1"
    v-bind="$attrs"
    size="sm"
    variant="tonal"
    :label="t('navigation.back')"
    class="bg-base-background"
  >
    <template #prepend><Icon icon="arrow-left" size="2xs" /></template>
  </Button>
</template>

<script lang="ts" setup>
import { Button, Icon } from "@upmind-automation/upmind-ui";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
const { t } = useI18n();
</script>
