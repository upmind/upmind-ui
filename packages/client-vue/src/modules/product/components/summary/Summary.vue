<template>
  <header :class="styles.summary.header">
    <SummaryPricing
      v-if="product?.pricing"
      :pricing="product.pricing"
      :meta="product.meta"
      :loading="meta.isLoading"
      :processing="meta.isCalculating"
      :details="product.details"
    />
  </header>

  <footer :class="styles.summary.footer" v-if="product?.productDetails">
    <!-- <NumberField
      v-if="product?.productDetails?.quantifiable"
      :min="product.productDetails.min"
      :max="product.productDetails.max"
      :step="product.productDetails.step"
      :model-value="product.configuration.quantity"
      :default-value="
        product.configuration.quantity || product.productDetails.step
      "
      @update:modelValue="updateQuantity"
      :disabled="meta.isLoading || meta.isProcessing"
      size="lg"
    /> -->

    <Button
      block
      type="submit"
      color="primary"
      :loading="meta.isProcessing"
      :disabled="meta.isLoading"
      :label="t('product.actions.resolve')"
      size="lg"
      @click="doResolve"
      icon="cart"
      pill
    />
  </footer>

  <Alert
    v-if="hasErrors"
    :title="t('product.incomplete.title')"
    :description="t('product.incomplete.description')"
    icon="alert"
    color="error"
  />
</template>

<script setup lang="ts">
// --- external
import { computed, ref, watch } from "vue";
import { useProductConfig } from "@upmind-automation/headless";
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./summary.config";

// --- components
import SummaryPricing from "./SummaryPricing.vue";
import { Alert, Button } from "@upmind-automation/upmind-ui";

// --- utils

// --- types
import type { ComputedRef } from "vue";
import type { ActorRef } from "xstate";
// -----------------------------------------------------------------------------

const props = defineProps<{
  item: ActorRef<any>;
}>();

const emits = defineEmits(["resolve"]);

const { t } = useI18n();

const showErrors = ref(false);

const { product, meta, model } = useProductConfig(props.item);

const styles = useStyles(["summary"], {}, config) as ComputedRef<{
  summary: {
    footer: string;
    header?: string;
  };
}>;

const hasErrors = computed(() => {
  return meta.value.hasErrors && showErrors.value;
});

watch(hasErrors, () => {
  if (hasErrors.value) {
    // TODO: Auto-scroll to the first error
  } else {
    showErrors.value = false;
  }
});

// ---
const doResolve = async () => {
  emits("resolve", model.value);
  showErrors.value = true;
};
</script>
