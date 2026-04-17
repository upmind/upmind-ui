<template>
  <Transitions>
    <component :is="templateVariant" :key="props.template">
      <template v-if="!isSlotHidden('summary')" #summary>
        <slot name="summary">
          <BasketSummary :loading="meta.isLoading">
            <template #append>
              <Back
                v-if="props.storefrontRoute"
                v-bind="props.storefrontRoute"
                :label="t('action.continue_shopping')"
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
          <BasketErrors
            id="basket-errors"
            basket-fields
            basket-products
            :basket-products-route="props.editRoute"
          />
        </slot>
      </template>

      <template #markdown>
        <slot name="markdown">
          <Markdown
            v-if="ui.trustMessaging.isVisible && data.trustMessagingMarkdown"
            data-testid="slots:summary-append"
            :model-value="data.trustMessagingMarkdown"
          />
          <Markdown
            v-else-if="basketSummaryTemplate?.body"
            :model-value="basketSummaryTemplate.body"
          />
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

      <template #custom-price>
        <Alert
          v-if="meta.hasCustomPrice"
          variant="minimal"
          color="warning"
          icon="switch-horizontal-01"
          :title="t('text.custom_price_applied')"
          :description="t('text.basket_custom_price_alert')"
        />
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
  onUnmounted,
  onMounted
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
import {
  useConfig,
  validateTemplate,
  useClientTemplate
} from "@upmind-automation/headless";
import { useThemes } from "@upmind-automation/upmind-ui";

// --- components
import Back from "../../components/navigation/Back.vue";
import BasketSummary from "./components/BasketSummary.vue";
import BasketProducts from "./components/BasketProducts.vue";
import BasketPricing from "./components/BasketPricing.vue";
import BasketErrors from "./components/BasketErrors.vue";
import BasketCheckout from "./components/BasketCheckout.vue";
import BasketTotal from "./components/BasketTotal.vue";
import Transitions from "../../components/layout/components/transition/Transition.vue";
import { Alert, Markdown } from "@upmind-automation/upmind-ui";

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
import {
  UIContext,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";
import type { StorefrontRoute } from "../../types";
import { LAYOUT_VARIANTS } from "../../components/layout/types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    template?: BASKET_TEMPLATE;
    basketRoute?: RouteLocationAsRelativeGeneric;
    storefrontRoute?: StorefrontRoute;
    editRoute: RouteLocationAsRelativeGeneric;
    hideSlots?: string[];
  }>(),
  {
    hideSlots: () => []
  }
);

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { set } = useThemes();
const { navigateNext } = useRoutingEngine();
const { isReady, meta, basketId } = useBasket();
const { variant } = useLayout();

const open = ref(false);

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const { ui, data } = useConfig({
  context: UIContext.BASKET,
  provide: true
});
const template = computed(() =>
  validateTemplate(
    ui.template.value || props.template,
    BASKET_TEMPLATE,
    BASKET_TEMPLATE.TWO_COLUMN_LTR
  )
);

const templateVariant = computed(() => get(supportedTemplates, template.value));

// @deprecated — Removed to avoid blocking render behind the global loader.
// Components now rely on inline skeleton states for loading feedback instead.
// await isReady();

const { data: basketSummaryTemplate } = useClientTemplate({
  code: ClientTemplateSlotCodes.BASKET_SUMMARY_FOOTER,
  objectId: basketId.value
});

set(ui.theme.value);

// -----------------------------------------------------------------------------
// --- side effects

await isReady().then(() => {
  const { dataLayer } = useDataLayer();
  dataLayer({ event: "view_cart" }).withEcommerce().push();
});

onUnmounted(() => {
  useHeader({});
  useLayout({});
  useFooter({});
});
</script>
