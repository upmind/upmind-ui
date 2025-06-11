<template>
  <Loading :active="meta.isLoading || meta.isProcessing">
    <Card :class="styles.product.root.card" v-auto-animate>
      <div :class="styles.product.root.container">
        <BasketProductSummary
          v-for="(summary, index) in props.pricing"
          :key="`${props.id}-${index}`"
          :id="id"
          :productDetails="props.productDetails"
          :summary="summary"
          :quantity="props.configuration.quantity"
          :error="meta.hasErrors"
          :primary="index === 0"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          :edit-link="editLink"
          @update:quantity="doUpdateQuantity"
          data-testid="basket-product-summary"
        >
          <slot
            :productDetails="props.productDetails"
            :price="price"
            :quantity="props.configuration.quantity"
          ></slot>
        </BasketProductSummary>
      </div>

      <BasketConfigurationDetails v-if="open" :id="id" :details="details" />

      <BasketProductActions
        v-model:open="open"
        :id="props.id"
        :details="details"
        :disabled="meta.isProcessing || meta.isLoading"
        :color="color"
        :edit-link="editLink"
        @remove="doRemove"
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
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";

// --- components
import { Loading } from "@upmind-automation/upmind-ui";
import Card from "../../../components/content/Card.vue";
import BasketConfigurationDetails from "./BasketProductConfigurationDetails.vue";
import BasketProductSummary from "./BasketProductSummary.vue";
import BasketProductActions from "./BasketProductActions.vue";

// --- utils
import { isEmpty, some } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import { type BasketProductProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    BasketProductProps & {
      loading?: boolean;
      processing?: boolean;
      disabled?: boolean;
    }
  >(),
  {
    open: false,
  }
);

const emits = defineEmits(["update:open", "update:quantity", "remove"]);

const open = useVModel(props, "open", emits);

const meta = computed(() => ({
  isDisabled: props.disabled,
  isLoading: props.loading,
  isProcessing: props.processing,
  isUnavailable: isEmpty(props.id),
  hasErrors: !isEmpty(props.errors) || some(props.details, "meta.invalid"),

  // ---
  hasTerms: !!props?.configuration?.term,
  hasOptions: !!props?.configuration?.options,
  hasAttributes: !!props?.configuration?.attributes,
  hasProvisioning: !!props?.configuration?.provisionFields,
}));

// error: computed(() => get(props, "error")),
//     product: computed(() => get(props, "product")),
//     model: computed(() => omit(props, ["product", "summary", "error"])),
//     summary: computed(() => get(props, "summary")),

const styles = useStyles(["product.root"], meta, config) as ComputedRef<{
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

function doUpdateQuantity(value: number) {
  emits("update:quantity", value);
}

function doRemove() {
  emits("remove");
}
</script>
