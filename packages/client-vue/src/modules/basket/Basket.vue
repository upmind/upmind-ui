<template>
  <Transitions>
    <component :is="templateVariant" :key="props.template">
      <template v-if="!isSlotHidden('summary')" #summary>
        <slot name="summary">
          <BasketSummary :loading="meta.isLoading">
            <template #append>
              <Back
                v-if="props.storefrontRoute"
                :to="props.storefrontRoute"
                :label="t('action.continue_shopping')"
                class="mt-4"
              />
            </template>
          </BasketSummary>
        </slot>
      </template>

      <template #products>
        <BasketProducts v-model:open="open" :edit-route="props.editRoute">
          <template #products="{ open }">
            <slot name="products" :open="open" />
          </template>
        </BasketProducts>
      </template>

      <template #pricing>
        <slot name="pricing">
          <BasketPricing
            @resolve="navigateNext"
            :disabled="
              meta.isProcessing ||
              meta.isLoading ||
              !meta.hasFields ||
              !meta.hasProducts ||
              meta.hasInvalidProducts
            "
            :loading="meta.isProcessing"
            :show-checkout="
              template !== BASKET_TEMPLATE.TWO_COLUMN_RTL &&
              template !== BASKET_TEMPLATE.ENCLOSED &&
              !meta.isLoading
            "
            :show-total="variant !== LAYOUT_VARIANTS.TWO_COLUMN_RTL"
          />
        </slot>
      </template>

      <template #total>
        <BasketTotal footer />
      </template>

      <template #errors>
        <slot name="errors">
          <BasketErrors :basket-products-route="props.editRoute" />
        </slot>
      </template>

      <template v-if="!meta.isLoading" #checkout>
        <slot name="checkout">
          <BasketCheckout
            @resolve="navigateNext"
            :disabled="
              meta.isProcessing ||
              meta.isLoading ||
              !meta.hasFields ||
              !meta.hasProducts ||
              meta.hasInvalidProducts
            "
            :loading="meta.isProcessing"
          />
        </slot>
      </template>
    </component>
  </Transitions>
</template>

<script lang="ts" setup>
// --- external
import {
  ref,
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted
} from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useDataLayer,
  useRoutingEngine
} from "@upmind-automation/headless";
import { useLayout } from "../../components/layout/useLayout";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";

// --- components
import Back from "../../components/navigation/Back.vue";
import BasketSummary from "./components/BasketSummary.vue";
import BasketProducts from "./components/BasketProducts.vue";
import BasketPricing from "./components/BasketPricing.vue";
import BasketErrors from "./components/BasketErrors.vue";
import BasketCheckout from "./components/BasketCheckout.vue";
import BasketTotal from "./components/BasketTotal.vue";
import Transitions from "../../components/layout/components/transition/Transition.vue";

// --- templates
const supportedTemplates = {
  [BASKET_TEMPLATE.FULL]: defineAsyncComponent(
    () => import("./templates/BasketFull.template.vue")
  ),
  [BASKET_TEMPLATE.TWO_COLUMN_LTR]: defineAsyncComponent(
    () => import("./templates/BasketLTR.template.vue")
  ),
  [BASKET_TEMPLATE.TWO_COLUMN_RTL]: defineAsyncComponent(
    () => import("./templates/BasketRTL.template.vue")
  ),
  [BASKET_TEMPLATE.ENCLOSED]: defineAsyncComponent(
    () => import("./templates/BasketEnclosed.template.vue")
  )
};

// --- utils
import { get, includes } from "lodash-es";

// --- types
import { BASKET_TEMPLATE } from "./types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import { LAYOUT_VARIANTS } from "../../components/layout/types";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    template?: BASKET_TEMPLATE;
    basketRoute?: RouteLocationAsRelativeGeneric;
    storefrontRoute?: RouteLocationAsRelativeGeneric;
    editRoute: RouteLocationAsRelativeGeneric;
    hideSlots?: string[];
  }>(),
  {
    template: BASKET_TEMPLATE.TWO_COLUMN_LTR,
    hideSlots: () => []
  }
);

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigateNext } = useRoutingEngine();
const { count, summary, isReady, meta } = useBasket();
const { variant } = useLayout();

const open = ref(false);

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const templateVariant = computed(() =>
  get(
    supportedTemplates,
    props.template,
    supportedTemplates[BASKET_TEMPLATE.TWO_COLUMN_LTR]
  )
);

await isReady();

onUnmounted(() => {
  useHeader({});
  useLayout({});
  useFooter({});
});

// -----------------------------------------------------------------------------

// const { dataLayer } = useDataLayer();
// dataLayer({ event: "view_cart" }).withEcommerce().push();
</script>
