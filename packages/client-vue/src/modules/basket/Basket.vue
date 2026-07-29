<template>
  <Transitions>
    <component :is="templateVariant" :key="props.template">
      <template v-if="!isSlotHidden('summary')" #summary>
        <slot name="summary">
          <BasketHero :loading="meta.isLoading">
            <template #append>
              <Back
                v-if="props.storefrontRoute"
                v-bind="props.storefrontRoute"
                :label="t('action.continue_shopping')"
              />
            </template>
          </BasketHero>
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
        <BasketProducts
          v-model:open="open"
          :edit-route="props.editRoute"
          :configurable="ui.basketItemConfig.isEditable"
          :disabled="isNavigating"
          @resolve="scrollToProduct"
        >
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
              !meta.hasFields || !meta.hasProducts || meta.hasLockedProducts
            "
            :loading="meta.isProcessing || isNavigating"
            :show-checkout="
              template !== BASKET_TEMPLATE.TWO_COLUMN_RTL &&
              template !== BASKET_TEMPLATE.ENCLOSED &&
              !meta.isLoading
            "
            :show-total="template !== BASKET_TEMPLATE.TWO_COLUMN_RTL"
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
              !meta.hasFields || !meta.hasProducts || meta.hasLockedProducts
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
// --- external
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useQueryParams,
  useRoutingEngine
} from "@upmind-automation/headless";
import {
  useConfig,
  validateTemplate,
  useClientTemplate
} from "@upmind-automation/headless";
import { useThemes } from "@upmind-automation/upmind-ui";

// --- components
import Back from "../../components/navigation/Back.vue";
import BasketHero from "./components/BasketHero.vue";
import BasketProducts from "./components/BasketProducts.vue";
import BasketPricing from "./components/BasketPricing.vue";
import BasketAlerts from "./components/BasketAlerts.vue";
import BasketCheckout from "./components/BasketCheckout.vue";
import BasketTotal from "./components/BasketTotal.vue";
import Transitions from "../../components/layout/components/transition/Transition.vue";
import { Alert, Markdown } from "@upmind-automation/upmind-ui";

// --- templates
import BasketFullTemplate from "./templates/BasketFull.template.vue";
import BasketLTRTemplate from "./templates/BasketLTR.template.vue";
import BasketRTLTemplate from "./templates/BasketRTL.template.vue";
import BasketEnclosedTemplate from "./templates/BasketEnclosed.template.vue";
import BasketInsetTemplate from "./templates/BasketInset.template.vue";

const supportedTemplates = {
  [BASKET_TEMPLATE.FULL]: BasketFullTemplate,
  [BASKET_TEMPLATE.TWO_COLUMN_LTR]: BasketLTRTemplate,
  [BASKET_TEMPLATE.TWO_COLUMN_RTL]: BasketRTLTemplate,
  [BASKET_TEMPLATE.ENCLOSED]: BasketEnclosedTemplate,
  [BASKET_TEMPLATE.INSET]: BasketInsetTemplate
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
const { navigateNext, isNavigating } = useRoutingEngine();
const { isReady, meta, basketId } = useBasket();
const { consumeParam } = useQueryParams();

const open = ref(false);

// The checkout summary links a product here with ?product=<bpid>. Once the
// cards have resolved into the DOM (Suspense @resolve), bring that one into
// view — block:nearest is a no-op when it's already visible. consumeParam
// reads and clears it, so it's a one-shot on arrival.
function scrollToProduct() {
  const bpid = consumeParam("product");
  if (!bpid) return;

  document
    .getElementById(`basket-product-${bpid}`)
    ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

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
