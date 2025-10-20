<template>
  <HeaderButtons />
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useBrand } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./header.config";

// --- components
import HeaderButtons from "./HeaderButtons.vue";
import { computed } from "vue";

// --- types
import type { ComputedRef } from "vue";

const { image, uiCart } = useBrand();

// -----------------------------------------------------------------------------
const { t } = useI18n();
const props = defineProps<{ logo?: string }>();

const meta = computed(() => {
  return {
    layout: uiCart.value?.layout
  };
});
</script>
