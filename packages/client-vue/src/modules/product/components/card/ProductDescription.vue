<template>
  <component
    :is="component"
    :label-more="t('action.show_more')"
    :label-less="t('action.show_less')"
    :lines="lines"
  >
    {{ description }}
  </component>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";
import { computed } from "vue";

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

const component = computed(() => {
  if (props.lineclamp) {
    return Lineclamp;
  }
  return "p";
});

const { t } = useI18n();
</script>
