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
          :error="meta.hasErrors"
          :loading="meta.isLoading"
          :processing="meta.isProcessing"
          :pricing="pricingProductIds"
          :edit-route="editRoute"
          :image="ui.productImages.isVisible"
          :inline-meta="inlineMeta"
          :upsell-options="upsellOptions"
          :terms="config?.terms?.value"
          v-model:open="openModel"
          v-model:quantity="quantityModel"
          v-model:term="termModel"
          v-model:options="optionsModel"
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
import styleConfigDef from "./basketProduct.config";
import { useConfig, useBasketProductInline } from "@upmind-automation/headless";

// --- components
import { Card, Loading } from "@upmind-automation/upmind-ui";
import BasketProductContent from "./BasketProductContent.vue";
import BasketProductOptionContent from "./BasketProductOptionContent.vue";

// --- utils
import { isEmpty, some, compact, map, debounce } from "lodash-es";

// --- types
import type { BasketProductProps } from "./types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import type { Product } from "@upmind-automation/headless";
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

const emits = defineEmits(["update:open", "remove"]);

const open = useVModel(props, "open", emits);

const { ui } = useConfig().with({
  product: () => props
});

// --- inline config

const {
  meta: inlineMeta,
  configure,
  filterUpsellOptions
} = useBasketProductInline(props.id);

const config = inlineMeta.value?.hasInlineControls
  ? await configure()
  : undefined;

if (config) await config.isReady();

const upsellOptions = computed(() =>
  filterUpsellOptions(config?.options?.value ?? [])
);

// --- meta

const meta = computed(() => ({
  isDisabled: props.disabled,
  isLoading: props.loading,
  isProcessing: props.processing || !!config?.meta?.value?.isProcessing,
  isUnavailable: isEmpty(props.id),
  hasErrors: !isEmpty(props.errors) || some(props.details, "meta.invalid"),

  // ---
  hasTerms: !!props?.configuration?.term,
  hasOptions: !!props?.configuration?.options,
  hasAttributes: !!props?.configuration?.attributes,
  hasProvisioning: !!props?.configuration?.provisionFields
}));

const styles = useStyles(["product.root"], meta, styleConfigDef);

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
  return index === 0 ? BasketProductContent : BasketProductOptionContent;
}

// --- writable models for v-model bindings

const debouncedUpdate = debounce(() => config?.update(), 500);

const openModel = computed({
  get: () => open.value,
  set: (value: boolean) => {
    open.value = value;
  }
});

const quantityModel = computed({
  get: () => props.configuration.quantity,
  set: (value: number) => {
    if (!config) return;
    config.updateQuantity(value);
    debouncedUpdate();
  }
});

const termModel = computed({
  get: () => config?.model?.value?.term,
  set: (value: number) => {
    if (!config) return;
    config.updateTerm(value)?.then(() => config.update());
  }
});

const optionsModel = computed({
  get: () => config?.model?.value?.options,
  set: (value: any) => {
    if (!config || !value) return;
    const { option, value: optValue, enabled } = value;
    config
      .toggleOption(option, optValue.id, enabled)
      ?.then(() => config.update());
  }
});

function doRemove() {
  emits("remove");
}
</script>
