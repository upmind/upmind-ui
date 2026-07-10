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
      :label="action.label"
      :icon="action.icon"
      :dataAttrs="{ 'data-test-key': 'button-add-to-basket' }"
      size="lg"
      @click="doResolve"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  useConfig,
  useRoutingEngine,
  type Product,
  type UseProductConfigMeta
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import { Button, NumberField } from "@upmind-automation/upmind-ui";
import stylesConfig from "../product.config";
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

const layout = computed(() => {
  return props?.template;
});

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

const styles = useStyles(["product"], { layout }, stylesConfig);

// ---
function updateQuantity(value: number | undefined) {
  emits("update:quantity", value);
}

function doResolve() {
  emits("resolve");
}
</script>
