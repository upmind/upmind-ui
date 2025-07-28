<template>
  <Markdown
    v-if="uiCart?.clickwrap_disclaimer"
    :model-value="uiCart.clickwrap_disclaimer"
    :keys="{ action: actionText }"
    :class="styles.checkout.clickwrap"
  />
</template>

<script lang="ts" setup>
// --- internal
import { useBrand } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../../checkout.config";

// --- components
import { Markdown } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";

// --- props
interface Props {
  actionText: string;
}

defineProps<Props>();
const { uiCart } = useBrand();

const styles = useStyles(["checkout"], {}, config) as ComputedRef<{
  checkout: {
    clickwrap: string;
  };
}>;
</script>
