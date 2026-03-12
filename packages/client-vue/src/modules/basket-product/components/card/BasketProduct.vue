<template>
  <Loading :active="meta.isLoading || meta.isProcessing" v-auto-animate>
    <Card :class="styles.product.root.card">
      <template
        v-for="(summary, index) in props.pricing"
        :key="`${props.id}-${index}`"
      >
        <component
          :is="getSummaryComponent(index)"
          data-testid="basket-product-summary"
          :id="id"
          :productDetails="props.productDetails"
          :serviceIdentifier="props.serviceIdentifier"
          :summary="summary"
          :details="details"
          :quantity="props.configuration.quantity"
          :error="meta.hasErrors"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          :pricing="pricingProductIds"
          :edit-route="editRoute"
          :open="open"
          :image="ui.productImages.isVisible"
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
    </Card>
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
import { useConfig } from "@upmind-automation/headless";

// --- components
import { Card, Loading } from "@upmind-automation/upmind-ui";
import BasketProductSummary from "./BasketProductSummary.vue";
import BasketProductOptionSummary from "./BasketProductOptionSummary.vue";

// --- utils
import { isEmpty, some, compact, map } from "lodash-es";

// --- types
import { type Product } from "@upmind-automation/headless";
import type { BasketProductProps } from "./types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    Product &
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

const { ui } = useConfig().with({
  product: () => props
});

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
