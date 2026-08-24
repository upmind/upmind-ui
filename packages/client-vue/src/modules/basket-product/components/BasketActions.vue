<template>
  <div :class="basketProductActionsVariants()" v-if="product?.productDetails">
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
      variant="primary"
      :data-attrs="{ 'data-test-key': 'button-confirm' }"
      :loading="meta.isProcessing || isNavigating"
      :disabled="meta.isLoading || meta.isUnavailable"
      size="lg"
      @click="doResolve"
    >
      {{ t("action.confirm") }}
      <Icon icon="arrow-right" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  useRoutingEngine,
  type Product,
  type UseProductConfigMeta
} from "@upmind-automation/headless";
import { NumberField } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import { basketProductActionsVariants } from "../basket-product.variants";

// --- types
// -----------------------------------------------------------------------------

defineProps<{
  product: Product;
  meta: UseProductConfigMeta;
  template?: string;
}>();

const emits = defineEmits(["resolve", "update:quantity"]);

const { t } = useI18n();
const { isNavigating } = useRoutingEngine();

// ---
function updateQuantity(value: number | undefined) {
  emits("update:quantity", value);
}

function doResolve() {
  emits("resolve");
}
</script>
