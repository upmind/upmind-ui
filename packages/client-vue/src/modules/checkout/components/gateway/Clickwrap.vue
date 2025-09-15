<template>
  <Markdown
    v-if="modelValue"
    :model-value="modelValue"
    :keys="keys"
    :class="styles.checkout.clickwrap"
  />
</template>

<script lang="ts" setup>
// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../../checkout.config";

// --- components
import { Markdown } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";

// --- props
interface Props {
  modelValue: string;
  keys: Record<string, string>;
}

defineProps<Props>();

const styles = useStyles(["checkout"], {}, config) as ComputedRef<{
  checkout: {
    clickwrap: string;
  };
}>;
</script>
