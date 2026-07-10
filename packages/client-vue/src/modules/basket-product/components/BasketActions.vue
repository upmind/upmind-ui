<template>
  <div :class="styles.basketProduct.actions" v-if="product?.productDetails">
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
      width="lg"
    />

    <Button
      block
      type="submit"
      color="primary"
      :dataAttrs="{ 'data-test-key': 'button-confirm' }"
      :loading="meta.isProcessing || isNavigating"
      :disabled="meta.isLoading || meta.isUnavailable"
      :label="t('action.confirm')"
      size="lg"
      @click="doResolve"
      icon-append="arrow-right"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  useRoutingEngine,
  type Product,
  type UseProductConfigMeta
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import { Button, NumberField } from "@upmind-automation/upmind-ui";
import config from "../basket-product.config";

// --- types
// -----------------------------------------------------------------------------

const props = defineProps<{
  product: Product;
  meta: UseProductConfigMeta;
  template?: string;
}>();

const emits = defineEmits(["resolve", "update:quantity"]);

const { t } = useI18n();
const { isNavigating } = useRoutingEngine();

const layout = computed(() => {
  return props?.template;
});

const styles = useStyles(["basketProduct"], { layout }, config);

// ---
function updateQuantity(value: number | undefined) {
  emits("update:quantity", value);
}

function doResolve() {
  emits("resolve");
}
</script>
