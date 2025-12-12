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

import { useLayout } from "../../../../components/layout/useLayout";

// --- types
import type { Product } from "@upmind-automation/headless";
import { LAYOUT_VARIANTS } from "../../../../components/layout/types";

const props = defineProps<{
  description?: Product["productDetails"]["description"];
  lineclamp?: boolean;
}>();

const { variant } = useLayout();

const component = computed(() => {
  if (props.lineclamp) {
    return Lineclamp;
  }
  return "p";
});

const lines = computed(() => {
  if (
    variant.value === LAYOUT_VARIANTS.TWO_COLUMN_RTL ||
    variant.value === LAYOUT_VARIANTS.TWO_COLUMN_LTR
  ) {
    return 2;
  }

  return 3;
});

const { t } = useI18n();
</script>
