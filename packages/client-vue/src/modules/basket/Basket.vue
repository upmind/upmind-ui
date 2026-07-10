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
        <slot name="errors">
          <BasketAlerts
            id="basket-errors"
            basket-fields
            basket-products
            :basket-products-route="props.editRoute"
          />
        </slot>
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
              meta.hasLockedProducts
            "
            :loading="meta.isProcessing || isNavigating"
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

      <template #markdown>
        <slot name="markdown">
          <Markdown
            v-if="ui.trustMessaging.isVisible && data.trustMessagingMarkdown"
            v-bind="trustMessagingTestAttrs"
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
              meta.hasLockedProducts
            "
            :loading="meta.isProcessing || isNavigating"
          />
        </slot>
      </template>

      <template #custom-price>
        <Alert
          v-if="meta.hasCustomPrice"
          variant="muted"
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
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBasket, useRoutingEngine } from "@upmind-automation/headless";
import {
  useConfig,
  validateTemplate,
  useClientTemplate
} from "@upmind-automation/headless";
import {
  UIContext,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";
import { useTestAttrs, useThemes } from "@upmind-automation/upmind-ui";
import { Alert, Markdown } from "@upmind-automation/upmind-ui";
import Transitions from "../../components/layout/components/transition/Transition.vue";
import { LAYOUT_VARIANTS } from "../../components/layout/types";
import { useLayout } from "../../components/layout/useLayout";
import Back from "../../components/navigation/Back.vue";
import BasketAlerts from "./components/BasketAlerts.vue";
import BasketCheckout from "./components/BasketCheckout.vue";
import BasketPricing from "./components/BasketPricing.vue";
import BasketProducts from "./components/BasketProducts.vue";
import BasketSummary from "./components/BasketSummary.vue";
import BasketTotal from "./components/BasketTotal.vue";
import BasketEnclosedTemplate from "./templates/BasketEnclosed.template.vue";
import BasketFullTemplate from "./templates/BasketFull.template.vue";
import BasketLTRTemplate from "./templates/BasketLTR.template.vue";
import BasketRTLTemplate from "./templates/BasketRTL.template.vue";
import { BASKET_TEMPLATE } from "./types";
import { get, includes } from "lodash-es";
import type { StorefrontRoute } from "../../types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

const supportedTemplates = {
  [BASKET_TEMPLATE.FULL]: BasketFullTemplate,
  [BASKET_TEMPLATE.TWO_COLUMN_LTR]: BasketLTRTemplate,
  [BASKET_TEMPLATE.TWO_COLUMN_RTL]: BasketRTLTemplate,
  [BASKET_TEMPLATE.ENCLOSED]: BasketEnclosedTemplate
};
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
const { navigateNext, isNavigating } = useRoutingEngine();
const { isReady, meta, basketId } = useBasket();
const { variant } = useLayout();

const open = ref(false);

const trustMessagingTestAttrs = useTestAttrs({ key: "slots:summary-append" });

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

await isReady();

const { data: basketSummaryTemplate } = useClientTemplate({
  code: ClientTemplateSlotCodes.BASKET_SUMMARY_FOOTER,
  objectId: basketId.value
});

set(ui.theme.value);

// -----------------------------------------------------------------------------

// const { dataLayer } = useDataLayer();
// dataLayer({ event: "view_cart" }).withEcommerce().push();
</script>
