<template>
  <Loading :active="meta.isLoading || meta.isProcessing">
    <Card :class="styles.product.root.card">
      <div :class="styles.product.root.container">
        <BasketProductSummary
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
        </BasketProductSummary>
      </div>

      <div v-auto-animate>
        <BasketConfigurationDetails
          v-if="open"
          :id="id"
          :details="summary.details"
        />
      </div>

      <BasketProductActions
        v-model:open="open"
        :id="props.id"
        :details="summary.details"
        :disabled="meta.isProcessing || meta.isLoading"
        :color="color"
        :edit-link="editLink"
        @remove="remove"
      />
    </Card>
  </Loading>
</template>

<script lang="ts" setup>
// --- external
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed } from "vue";

// --- internal
import { useBasketProduct } from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- components
import { Loading } from "@upmind-automation/upmind-ui";
import Card from "../../../../components/content/Card.vue";
import BasketConfigurationDetails from "./BasketProductConfigurationDetails.vue";
import BasketProductSummary from "./BasketProductSummary.vue";
import BasketProductActions from "./BasketProductActions.vue";

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
