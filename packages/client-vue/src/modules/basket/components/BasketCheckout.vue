<template>
  <Button
    @click="doResolve"
    block
    size="lg"
    :disabled="props.disabled"
    :loading="props.loading"
    :label="t('action.proceed_to_checkout')"
    icon-append="arrow-right"
    data-testid="basket-checkout-button"
  />
</template>
<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { Button } from "@upmind-automation/upmind-ui";
import type { BasketCheckoutProps } from "./types";

// --- types
const props = defineProps<BasketCheckoutProps>();

const { t } = useI18n();

const emit = defineEmits<{
  (e: "resolve"): void;
}>();

function doResolve() {
  emit("resolve");
}
</script>
