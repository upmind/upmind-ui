<template>
  <div :class="productActionsVariants()" v-if="product?.productDetails">
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
      :loading="meta.isProcessing || isNavigating"
      :disabled="meta.isLoading || meta.isUnavailable || isUnavailable"
      :data-attrs="{ 'data-test-key': 'button-add-to-basket' }"
      size="lg"
      @click="doResolve"
    >
      <Icon v-if="action.icon" :icon="action.icon" />
      {{ action.label }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { NumberField } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  useConfig,
  useRoutingEngine,
  type Product,
  type UseProductConfigMeta
} from "@upmind-automation/headless";
import { Icon } from "../../../components/icon";
import { productActionsVariants } from "../variants";
import { isString } from "lodash-es";

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

const config = useConfig().with({
  product: () => props.product
});

const isUnavailable = computed(() => !!config.data.productUnavailable);

const action = computed(() => {
  if (isUnavailable.value) {
    const reason = config.data.productUnavailableReason;
    if (!reason) return { label: t("text.unavailable") };
    return isString(reason) ? { label: reason } : reason;
  }
  return { label: t("action.add_to_basket"), icon: "shopping-bag-02" };
});

// ---
function updateQuantity(value: number | undefined) {
  emits("update:quantity", value);
}

function doResolve() {
  emits("resolve");
}
</script>
