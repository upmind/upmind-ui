<template>
  <Markdown
    v-if="product?.productDetails"
    data-testid="slots:summary-append"
    :model-value="
      product?.productDetails?.uiMeta?.uischema?.config?.summary?.append ??
      product?.productDetails?.uiMeta?.uischema?.productConfig?.summary?.append
    "
  />
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";
import { useProductConfig } from "@upmind-automation/headless";
import { useI18n } from "vue-i18n";

// --- components
import { Markdown, Alert } from "@upmind-automation/upmind-ui";

// --- types;
import type { ActorRef } from "xstate";
// -----------------------------------------------------------------------------

const props = defineProps<{
  item: ActorRef<any>;
}>();

const emits = defineEmits(["resolve"]);

const { product } = useProductConfig(props.item);
</script>
