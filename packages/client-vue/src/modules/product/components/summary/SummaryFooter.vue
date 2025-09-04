<template>
  <Markdown
    v-if="product?.productDetails"
    data-testid="slots:summary-append"
    :model-value="
      props.product?.productDetails?.uiMeta?.uischema?.config?.summary
        ?.append ??
      props.product?.productDetails?.uiMeta?.uischema?.productConfig?.summary
        ?.append
    "
  />
</template>

<script setup lang="ts">
// --- external

// --- components
import { Markdown } from "@upmind-automation/upmind-ui";

// --- types;
import { type Product } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const props = defineProps<{ product: Product }>();
</script>
