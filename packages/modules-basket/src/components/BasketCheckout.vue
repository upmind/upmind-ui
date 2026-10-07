<template>
  <Button
    @click="doResolve"
    block
    size="lg"
    :disabled="props.disabled"
    :loading="props.loading"
    :data-attrs="{ 'data-test-key': 'basket-checkout-button' }"
  >
    {{ t("action.proceed_to_checkout") }}
    <Icon icon="arrow-right" />
  </Button>
</template>
<script lang="ts" setup>
import { Button } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/foundation";
import type { BasketCheckoutProps } from "./types";

// --- types
const props = defineProps<BasketCheckoutProps>();

const emit = defineEmits<{
  (e: "resolve"): void;
}>();

const { t } = useI18n();

function doResolve() {
  emit("resolve");
}
</script>
