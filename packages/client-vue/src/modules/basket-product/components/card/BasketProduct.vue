<template>
  <Loading
    as="li"
    :class="styles.product.root.card"
    v-auto-animate
    :active="meta.isLoading || meta.isProcessing"
  >
    <div class="flex flex-col divide-y divide-dashed [&>*]:py-4">
      <template
        v-for="(summary, index) in props.pricing"
        :key="`${props.id}-${index}`"
      >
        <component
          :is="getSummaryComponent(index)"
          data-testid="basket-product-summary"
          :id="id"
          :productDetails="props.productDetails"
          :summary="summary"
          :details="details"
          :quantity="props.configuration.quantity"
          :error="meta.hasErrors"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          :pricing="pricingProductIds"
          :edit-route="editRoute"
          :open="open"
          @update:open="setOpen"
          @update:quantity="doUpdateQuantity"
          @remove="doRemove"
        >
          <slot
            :productDetails="props.productDetails"
            :price="price"
            :quantity="props.configuration.quantity"
          ></slot>
        </component>
      </template>
    </div>
  </Loading>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./basketProduct.config";

// --- components
import { Loading } from "@upmind-automation/upmind-ui";
import BasketProductSummary from "./BasketProductSummary.vue";
import BasketProductOptionSummary from "./BasketProductOptionSummary.vue";

// --- utils
import { isEmpty, some, compact, map } from "lodash-es";

// --- types
import type { BasketProductProps } from "./types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    BasketProductProps & {
      loading?: boolean;
      processing?: boolean;
      disabled?: boolean;
      editRoute: RouteLocationAsRelativeGeneric;
    }
  >(),
  {
    open: false
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
  hasProvisioning: !!props?.configuration?.provisionFields
}));

const styles = useStyles(["product.root"], meta, config);

const editRoute = computed(() => {
  return {
    to: {
      ...props.editRoute,
      params: {
        bpid: props.id
      }
    }
  } as RouteLocationAsRelativeGeneric;
});

const pricingProductIds = computed(() => compact(map(props.pricing, "id")));

function getSummaryComponent(index: number) {
  return index === 0 ? BasketProductSummary : BasketProductOptionSummary;
}

function setOpen(value: boolean) {
  open.value = value;
}

function doUpdateQuantity(value: number) {
  emits("update:quantity", value);
}

function doRemove() {
  emits("remove");
}
</script>
