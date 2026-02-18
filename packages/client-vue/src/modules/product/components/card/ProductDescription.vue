<template>
  <Lineclamp
    v-if="lineclamp"
    :label-more="t('action.show_more')"
    :label-less="t('action.show_less')"
    :lines="lines"
  >
    <p>{{ description }}</p>
  </Lineclamp>
  <p v-else>
    {{ description }}
  </p>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Lineclamp } from "@upmind-automation/upmind-ui";

// --- types
import type { Product } from "@upmind-automation/headless";

const props = withDefaults(
  defineProps<{
    description?: Product["productDetails"]["description"];
    lineclamp?: boolean;
    lines?: number;
  }>(),
  {
    lineclamp: true,
    lines: 3
  }
);

const { t } = useI18n();
</script>
