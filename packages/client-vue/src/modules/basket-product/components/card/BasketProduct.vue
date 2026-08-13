<template>
  <Loading :active="meta.isOverlayActive">
    <div :class="styles.product.list">
      <!-- Product: summary + optional inline configuration. Presents as its
           own Card, or flat inside a parent card (e.g. "Your Order"). The id
           prefix is the scroll anchor Basket.vue looks up for summary links. -->
      <component
        :is="props.card ? Card : 'div'"
        :id="`basket-product-${props.id}`"
        :class="styles.product.container"
      >
        <!-- Basket product summary -->
        <div :class="styles.product.summaries">
          <template
            v-for="(summary, index) in visiblePricing"
            :key="`${props.id}-${index}`"
          >
            <BasketProductContent
              v-if="index === 0"
              v-bind="basketProductSummaryTestAttrs"
              :id="id"
              :productDetails="props.productDetails"
              :serviceIdentifier="props.serviceIdentifier"
              :summary="summary"
              :details="details"
              :error="meta.hasErrors"
              :warning="meta.hasWarning"
              :config-errors="configErrors"
              :loading="meta.isLoading"
              :processing="meta.isProcessing"
              :prices-updating="basketMeta.isPricesUpdating"
              :pricing="pricingProductIds"
              :edit-route="editRoute"
              :image="ui.productImages.isVisible"
              :inline-meta="inlineMeta"
              :upsell-options="upsellOptions"
              :terms="config?.terms?.value"
              :configurable="meta.isConfigurable"
              v-model:open="openModel"
              v-model:quantity="quantityModel"
              v-model:term="termModel"
              @remove="doRemove"
            />
            <BasketProductSubItem
              v-else
              v-bind="basketProductSummaryTestAttrs"
              :summary="summary"
            />
          </template>
        </div>

        <!-- Inline config: options/attributes/domain and provisioning. Terms
             are owned by the card's own term selector (hide-terms). -->
        <Config
          v-if="configMeta && meta.hasConfiguration"
          :meta="configMeta"
          :class="styles.product.config"
          hide-terms
          :touched="meta.showConfigErrors"
          no-footer
          as="fieldset"
          v-bind="basketProductConfigTestAttrs"
          autosave
          :resolve-fields="['term', 'quantity', 'options', 'attributes']"
          @resolve="debouncedUpdate"
        />

        <!-- Upsell options render inline inside the product card. -->
        <div
          v-for="{ upsell, option, benefits } in filteredUpsells"
          :key="`${props.id}-upsell-${upsell.id}`"
          :class="styles.product.option.upsell"
        >
          <BasketProductUpsell
            v-bind="basketProductUpsellTestAttrs"
            :id="id"
            :summary="upsell"
            :option="option"
            :processing="meta.isProcessing"
            @update:quantity="
              (value: number) => onOptionQuantity(upsell, option, value)
            "
            @toggle="
              (enabled: boolean) => onUpsellToggle(upsell, option, enabled)
            "
          />
          <BasketProductBenefits :benefits="benefits" />
        </div>
      </component>
    </div>
  </Loading>
</template>

<script lang="ts" setup>
import { useVModel } from "@vueuse/core";
import { computed, onUnmounted, provide } from "vue";
import {
  useBasket,
  useConfig,
  UIContext,
  useBasketProductInline
} from "@upmind-automation/headless";
import { useStyles, useTestAttrs } from "@upmind-automation/upmind-ui";
import { Card, Loading } from "@upmind-automation/upmind-ui";
import Config from "../../../product/components/Config.vue";
import stylesConfig from "./basketProduct.config";
import BasketProductContent from "./BasketProductContent.vue";
import BasketProductSubItem from "./BasketProductSubItem.vue";
import BasketProductUpsell from "./BasketProductUpsell.vue";
import BasketProductBenefits from "./components/BasketProductBenefits.vue";
import { isEmpty, some, compact, take, map, debounce } from "lodash-es";
import type { BasketProductProps } from "./types";
import type {
  Product,
  BasketUpsellSummary,
  SubproductDetails,
  UseBasketProduct,
  UseMetaResult
} from "@upmind-automation/headless";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<Product & BasketProductProps>(), {
  open: false,
  card: true
});

const emits = defineEmits(["update:open", "remove"]);

const open = useVModel(props, "open", emits);

const productConfig = useConfig().with({
  basketProduct: () => props
});

const { ui } = productConfig;

const { meta: basketMeta } = useBasket();

// --- test attrs

const basketProductSummaryTestAttrs = useTestAttrs({
  key: "basket-product-summary"
});
const basketProductUpsellTestAttrs = useTestAttrs({
  key: "basket-product-upsell"
});
const basketProductConfigTestAttrs = useTestAttrs({
  key: "basket-product-config"
});

// --- inline config

const {
  meta: inlineMeta,
  configure,
  filterUpsellOptions,
  resolveUpsells,
  filterPricing
} = useBasketProductInline(props.id);

// a config machine powers both the inline controls and the configurable card
let config: UseBasketProduct | undefined;
// meta for the inline configuration form rendered inside the card
let configMeta: UseMetaResult | undefined;

if (ui.basketItemConfig.isEditable || inlineMeta.value.hasInlineControls) {
  config = await configure();
  await config.isReady();
}

if (config && ui.basketItemConfig.isEditable) {
  // Config.vue injects the machine by key, and the form renderers inside it call
  // useConfig() with no arguments — neither has a prop path here. Without both
  // provides they resolve the page's meta instead of this CONFIGURE one.
  configMeta = useConfig({
    context: UIContext.CONFIGURE,
    product: () => config.product.value,
    provide: true
  });
  provide("useProductConfig", config);
}

const upsellOptions = computed(() =>
  filterUpsellOptions(config?.options?.value ?? [])
);

// Resolves static catalog upsells against the live per-card config (pricing,
// pre-selected filtering, benefits). Lives here because config is spawned
// per-card; shared with visiblePricing below so both read the same list.
const filteredUpsells = computed(() => resolveUpsells(config));

// Configurable cards show the main server row only (addons render inside the
// inline config); others strip rows already rendered as upsell cards. Never
// price from the config machine's local preview — only the server basket row.
const visiblePricing = computed(() => {
  if (ui.basketItemConfig.isEditable) return take(props.pricing, 1);
  return filterPricing(props.pricing, filteredUpsells.value);
});

// --- meta

const meta = computed(() => {
  const isConfigurable = ui.basketItemConfig.isEditable;
  const isLoading = props.loading;
  const isProcessing =
    props.processing ||
    !!config?.meta?.value?.isProcessing ||
    !!config?.meta?.value?.isChecking;
  const hasErrors =
    !isEmpty(props.errors) || some(props.details, "meta.invalid");

  // A configurable card re-validates/re-prices on every inline edit; don't blank
  // it with the spinner overlay for that churn (the config form manages its own
  // state, the summary shows updating prices) — only its own load/processing
  // props count. Other cards blank on any work.
  const isOverlayActive =
    isLoading || props.processing || (!isConfigurable && isProcessing);

  return {
    // flat products inherit their parent card's inset; own-card keeps its own
    card: props.card,
    isConfigurable,
    isDisabled: props.disabled,
    isLoading,
    isProcessing,
    isOverlayActive,
    isUnavailable: isEmpty(props.id),
    hasErrors,
    hasConfigErrors: !!config?.meta?.value?.hasErrors,
    isConfigInvalid: !!config?.meta?.value?.isInvalid,
    // the inline form opens alongside the product, so errors seeded before the
    // user edited anything must not paint it red
    showConfigErrors:
      !!config?.meta?.value?.showErrors && !!config?.meta?.value?.isTouched,
    // A product-level error dims the promotion — but only on non-configurable
    // cards: configurable cards surface the errors inline in their own config
    // form, so they never dim. Warning presentation keys off this.
    hasWarning: hasErrors && !isConfigurable,

    // ---
    hasTerms: !!props?.configuration?.term,
    hasOptions: !!props?.configuration?.options,
    hasAttributes: !!props?.configuration?.attributes,
    hasProvisioning: !!props?.configuration?.provisionFields,
    hasConfiguration:
      isConfigurable &&
      (!!config?.meta?.value?.hasOptions ||
        !!config?.meta?.value?.hasAttributes ||
        !!config?.meta?.value?.hasProvisioning)
  };
});

const styles = useStyles(
  [
    "product.list",
    "product.container",
    "product.summaries",
    "product.config",
    "product.option.upsell"
  ],
  meta,
  stylesConfig
);

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

const configErrors = computed(
  () => config?.validationErrors?.value || config?.errors?.value
);

// --- writable models for v-model bindings

// keep the card's historical save debounce — DEBOUNCE_DELAY is snappier and
// would fire mid-adjustment on repeated quantity taps
const UPDATE_DEBOUNCE_MS = 500;

const debouncedUpdate = debounce(
  (options?: { forced?: boolean }) => config?.update(options),
  UPDATE_DEBOUNCE_MS
);

// flush on unmount — updateQuantity only writes the local model, so cancelling
// a queued save here discards the edit instead of deferring it
onUnmounted(() => debouncedUpdate.flush());

const openModel = computed({
  get: () => open.value,
  set: (value: boolean) => {
    open.value = value;
  }
});

const quantityModel = computed({
  get: () => config?.model?.value?.quantity ?? props.configuration.quantity,
  set: (value: number) => {
    if (!config) return;
    config.updateQuantity(value);
    debouncedUpdate({ forced: meta.value.isConfigInvalid });
  }
});

const termModel = computed({
  get: () => config?.model?.value?.term,
  set: (value: number) => {
    if (!config) return;
    const applied = config.updateTerm(value);
    applied?.then(() => config.update({ forced: meta.value.isConfigInvalid }));
  }
});

function onUpsellToggle(
  upsell: BasketUpsellSummary,
  option: SubproductDetails,
  enabled: boolean
) {
  if (!config) return;
  config
    .toggleOption(option, upsell.toggle.valueId, enabled)
    .then(() => config.update({ forced: meta.value.isConfigInvalid }));
}

function onOptionQuantity(
  upsell: BasketUpsellSummary,
  option: SubproductDetails,
  quantity: number
) {
  if (!config) return;
  config.updateOptionQuantity(option, upsell.toggle.valueId, quantity);
  debouncedUpdate({ forced: meta.value.isConfigInvalid });
}

function doRemove() {
  // the row is going away, so a queued save would PUT a removed product
  debouncedUpdate.cancel();
  emits("remove");
}
</script>
