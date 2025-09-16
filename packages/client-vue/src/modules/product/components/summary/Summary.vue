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
    <NumberField
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
      :width="configMeta.layout === 'enclosed' ? 'lg' : 'sm'"
    />

    <Button
      block
      type="submit"
      color="primary"
      :loading="meta.isProcessing"
      :disabled="meta.isLoading"
      :label="t(`product.actions.${edit ? 'resolveEdit' : 'resolve'}`)"
      size="lg"
      @click="doResolve"
      :icon-append="edit ? 'arrow-right' : ''"
      :icon="edit ? '' : 'cart'"
      pill
    />
  </footer>

  <Alert
    v-if="meta.showErrors"
    :title="t('product.incomplete.title')"
    :description="t('product.incomplete.description')"
    icon="alert"
    color="error"
  />
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import {
  useBrand,
  type Product,
  type UseProductConfigMeta
} from "@upmind-automation/headless";
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./summary.config";

// --- components
import SummaryPricing from "./SummaryPricing.vue";
import { Alert, Button, NumberField } from "@upmind-automation/upmind-ui";

// --- utils

// --- types
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------

const props = defineProps<{
  product: Product;
  meta: UseProductConfigMeta;
  edit?: boolean;
}>();

const emits = defineEmits(["resolve", "update:quantity"]);

const { t } = useI18n();

const { uiCart } = useBrand();

const configMeta = computed(() => ({
  layout: uiCart.value?.layout
}));

const styles = useStyles(["summary"], configMeta, config) as ComputedRef<{
  summary: {
    footer: string;
    header?: string;
  };
}>;

// ---
function updateQuantity(value: number) {
  emits("update:quantity", value);
}
function doResolve() {
  emits("resolve");
}
</script>
