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
      :width="layout === 'enclosed' ? 'lg' : 'md'"
    />

    <Button
      block
      type="submit"
      color="primary"
      :loading="meta.isProcessing"
      :disabled="meta.isLoading || meta.isUnavailable"
      :label="t('action.add_to_basket')"
      size="lg"
      @click="doResolve"
      icon="shopping-bag-02"
    />
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import {
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

const layout = computed(() => {
  return props?.template;
});

const styles = useStyles(["product"], { layout }, config);

// ---
function updateQuantity(value: number | undefined) {
  emits("update:quantity", value);
}

function doResolve() {
  emits("resolve");
}
</script>
