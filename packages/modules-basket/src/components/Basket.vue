<template>
  <LayoutProvider>
    <slot :template="ui.template.value" />

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

    <template #pricing="{ showCheckout = true, showTotal = true }">
      <slot name="pricing">
        <BasketPricing
          @resolve="navigateNext"
          :disabled="
            !meta.hasFields || !meta.hasProducts || meta.hasLockedProducts
          "
          :loading="meta.isProcessing || isNavigating"
          :show-checkout="showCheckout && !meta.isLoading"
          :show-total="showTotal"
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
            !meta.hasFields || !meta.hasProducts || meta.hasLockedProducts
          "
          :loading="meta.isProcessing || isNavigating"
        />
      </slot>
    </template>

    <template #custom-price>
      <Alert
        v-if="meta.hasCustomPrice"
        variant="warning"
        :title="t('text.custom_price_applied')"
        :description="t('text.basket_custom_price_alert')"
      >
        <template #icon><Icon icon="switch-horizontal-01" /></template>
      </Alert>
    </template>
  </LayoutProvider>
</template>

<script lang="ts" setup>
import { useTestAttrs } from "@upmind/ui";
import { Markdown } from "@upmind/ui";
import { Alert } from "@upmind/ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Back } from "@upmind-automation/foundation";
import { Icon } from "@upmind-automation/foundation";
import { LayoutProvider } from "@upmind-automation/foundation";
import {
  useBasket,
  useQueryParams,
  useRoutingEngine
} from "@upmind-automation/headless";
import { useConfig, useClientTemplate } from "@upmind-automation/headless";
import {
  UIContext,
  ClientTemplateSlotCodes
} from "@upmind-automation/headless";
import BasketAlerts from "./BasketAlerts.vue";
import BasketCheckout from "./BasketCheckout.vue";
import BasketHero from "./BasketHero.vue";
import BasketPricing from "./BasketPricing.vue";
import BasketProducts from "./BasketProducts.vue";
import BasketTotal from "./BasketTotal.vue";
import { includes } from "lodash-es";
import type { StorefrontRoute } from "@upmind-automation/foundation";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
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
const { navigateNext, isNavigating } = useRoutingEngine();
const { isReady, meta, basketId } = useBasket();
const { consumeParam } = useQueryParams();

const open = ref(false);

const trustMessagingTestAttrs = useTestAttrs({ key: "slots:summary-append" });
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

await isReady();

const { data: basketSummaryTemplate } = useClientTemplate({
  code: ClientTemplateSlotCodes.BASKET_SUMMARY_FOOTER,
  objectId: basketId.value
});

// -----------------------------------------------------------------------------

// const { dataLayer } = useDataLayer();
// dataLayer({ event: "view_cart" }).withEcommerce().push();
</script>
