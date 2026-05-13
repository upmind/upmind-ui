<template>
  <Loading :active="meta.isLoading || meta.isProcessing" v-auto-animate>
    <Card :class="styles.product.root.card">
      <!-- Basket product summary -->
      <div :class="styles.product.root.summaries">
        <template
          v-for="(summary, index) in visiblePricing"
          :key="`${props.id}-${index}`"
        >
          <BasketProductContent
            v-if="index === 0"
            data-testid="basket-product-summary"
            :id="id"
            :productDetails="props.productDetails"
            :serviceIdentifier="props.serviceIdentifier"
            :summary="summary"
            :details="details"
            :error="meta.hasErrors"
            :config-errors="configErrors"
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
            @remove="doRemove"
          />
          <BasketProductSubItem
            v-else
            data-testid="basket-product-summary"
            :summary="summary"
          />
        </template>
      </div>

      <!-- Upsell options -->
      <div
        v-for="{ upsell, option, benefits } in filteredUpsells"
        :key="`${props.id}-upsell-${upsell.id}`"
        :class="styles.product.option.upsell"
      >
        <BasketProductUpsell
          data-testid="basket-product-upsell"
          :id="id"
          :summary="upsell"
          :option="option"
          :error="meta.hasErrors"
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
import stylesConfig from "./basketProduct.config";
import { useConfig, useBasketProductInline } from "@upmind-automation/headless";

// --- components
import { Card, Loading } from "@upmind-automation/upmind-ui";
import BasketProductContent from "./BasketProductContent.vue";
import BasketProductSubItem from "./BasketProductSubItem.vue";
import BasketProductUpsell from "./BasketProductUpsell.vue";
import BasketProductBenefits from "./components/BasketProductBenefits.vue";

// --- utils
import { isEmpty, some, compact, map, debounce } from "lodash-es";

// --- types
import type { BasketProductProps } from "./types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import type {
  Product,
  BasketUpsellSummary,
  SubproductDetails
} from "@upmind-automation/headless";
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

const productConfig = useConfig().with({
  basketProduct: () => props
});

const { ui } = productConfig;

// --- inline config

const {
  meta: inlineMeta,
  configure,
  filterUpsellOptions,
  resolveUpsells,
  filterPricing
} = useBasketProductInline(props.id);

const config = inlineMeta.value?.hasInlineControls
  ? await configure()
  : undefined;

if (config) await config.isReady();

const upsellOptions = computed(() =>
  filterUpsellOptions(config?.options?.value ?? [])
);

// Resolves static catalog upsells against the live per-card config (pricing,
// pre-selected filtering, benefits). Lives here because config is spawned
// per-card; shared with visiblePricing below so both read the same list.
const filteredUpsells = computed(() => resolveUpsells(config));

// Strip pricing rows already rendered as upsells, otherwise selected upsells
// would appear twice (once in pricing, once in the upsell section).
const visiblePricing = computed(() =>
  filterPricing(props.pricing, filteredUpsells.value)
);

// --- meta

const meta = computed(() => ({
  isDisabled: props.disabled,
  isLoading: props.loading,
  isProcessing: props.processing || !!config?.meta?.value?.isProcessing,
  isUnavailable: isEmpty(props.id),
  hasErrors: !isEmpty(props.errors) || some(props.details, "meta.invalid"),
  hasConfigErrors: !!config?.meta?.value?.hasErrors,

  // ---
  hasTerms: !!props?.configuration?.term,
  hasOptions: !!props?.configuration?.options,
  hasAttributes: !!props?.configuration?.attributes,
  hasProvisioning: !!props?.configuration?.provisionFields
}));

const styles = useStyles(
  ["product.root", "product.root.summaries", "product.option.upsell"],
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

const debouncedUpdate = debounce(() => config?.update(), 500);

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

function onUpsellToggle(
  upsell: BasketUpsellSummary,
  option: SubproductDetails,
  enabled: boolean
) {
  if (!config) return;
  config
    .toggleOption(option, upsell.toggle.valueId, enabled)
    .then(() => config.update());
}

function onOptionQuantity(
  upsell: BasketUpsellSummary,
  option: SubproductDetails,
  quantity: number
) {
  if (!config) return;
  config.updateOptionQuantity(option, upsell.toggle.valueId, quantity);
  debouncedUpdate();
}

function doRemove() {
  emits("remove");
}
</script>
