<template>
  <div :class="styles.product.actions" v-if="product?.productDetails">
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
      :loading="meta.isProcessing || isNavigating"
      :disabled="meta.isLoading || meta.isUnavailable || isUnavailable"
      :label="
        isUnavailable
          ? (product?.meta?.availableReason ?? t('text.unavailable'))
          : t('action.add_to_basket')
      "
      :icon="isUnavailable ? '' : 'shopping-bag-02'"
      size="lg"
      @click="doResolve"
    />
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import {
  useRoutingEngine,
  type Product,
  type UseProductConfigMeta
} from "@upmind-automation/headless";
import { useI18n } from "vue-i18n";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- components
import { Button, NumberField } from "@upmind-automation/upmind-ui";

// --- internal
import config from "../product.config";

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

// `=== false` so undefined `meta.available` stays the safe "available" default
const isUnavailable = computed(() => props.product?.meta?.available === false);

const styles = useStyles(["product"], { layout }, config);

// ---
function updateQuantity(value: number | undefined) {
  emits("update:quantity", value);
}

function doResolve() {
  emits("resolve");
}
</script>
