<template>
  <Loading :active="meta.isLoading || meta.isProcessing">
    <UpmCard :class="styles.product.root.card">
      <div :class="styles.product.root.container">
        <UpmBasketProductSummary
          v-for="(pricing, index) in summary.pricing"
          :key="`${props.id}-${index}`"
          :id="id"
          :product="product"
          :pricing="pricing"
          :quantity="quantity"
          :error="meta.hasErrors"
          :primary="index === 0"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          :edit-link="editLink"
          :taxes="meta.hasTaxIncluded"
          @update:quantity="updateQuantity"
        >
          <slot :product="product" :pricing="pricing" :summary="summary" />
        </UpmBasketProductSummary>
      </div>

      <div v-auto-animate>
        <UpmBasketConfigurationDetails
          v-if="open"
          :id="id"
          :details="summary.details"
        />
      </div>

      <UpmBasketProductActions
        v-model:open="open"
        :id="props.id"
        :details="summary.details"
        :disabled="meta.isProcessing || meta.isLoading"
        :color="color"
        :edit-link="editLink"
        @remove="remove"
      />
    </UpmCard>
  </Loading>
</template>

<script lang="ts" setup>
// --- external
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed } from "vue";

// --- internal
import { useBasketProduct } from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upwind";
import config from "./config.cva";

// --- components
import UpmCard from "../../content/Card.vue";
import { Loading } from "@upmind-automation/upwind";
import UpmBasketConfigurationDetails from "./BasketProductConfigurationDetails.vue";
import UpmBasketProductSummary from "./BasketProductSummary.vue";
import UpmBasketProductActions from "./BasketProductActions.vue";

// --- types
import type { ComputedRef } from "vue";
import { type BasketProductProps } from "./types";
import { type BasketProduct } from "@upmind-automation/headless-vue";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketProduct & BasketProductProps>(), {
  open: false,
});

const emits = defineEmits(["update:open"]);

const open = useVModel(props, "open", emits);

const { meta, updateQuantity, remove } = useBasketProduct(props.id);

const stylesMeta = computed(() => ({
  hasErrors: !meta.value.isLoading && meta.value.hasErrors,
}));

const styles = useStyles(["product.root"], stylesMeta, config) as ComputedRef<{
  product: {
    root: {
      card: string;
      container: string;
      details: string;
    };
  };
}>;

const editLink = computed(() => {
  return {
    name: "product.edit",
    params: {
      bpid: props.id,
    },
  };
});
</script>
