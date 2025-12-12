<template>
  <div v-show="!meta.isCheckout">
    <component :is="templateVariant">
      <template #back>
        <slot name="back">
          <Back @click.prevent="navigateBack" />
        </slot>
      </template>

      <template v-if="!isSlotHidden('summary')" #summary>
        <slot name="summary">
          <CheckoutSummary :template="props.template" />
        </slot>
      </template>

      <template #content>
        <slot name="content">
          <CheckoutContent :edit-route="props.editRoute" />
        </slot>
      </template>

      <template #pricing>
        <slot name="pricing">
          <CheckoutPricing />
        </slot>
      </template>

      <template v-if="meta.hasErrors" #errors>
        <slot name="errors">
          <CheckoutErrors />
        </slot>
      </template>
    </component>
  </div>

  <!-- Basket processing -->
  <slot name="processing" v-if="meta.isCheckout">
    <CheckoutProcessing />
  </slot>
</template>

<script lang="ts" setup>
// --- external
import { watch, computed, onUnmounted, defineAsyncComponent } from "vue";

// --- internal
import {
  useBasket,
  useRoutingEngine,
  useDataLayer
} from "@upmind-automation/headless";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";

// --- components
import Back from "../../components/navigation/Back.vue";
import CheckoutProcessing from "./components/CheckoutProcessing.vue";
import CheckoutSummary from "./components/CheckoutSummary.vue";
import CheckoutContent from "./components/CheckoutContent.vue";
import CheckoutPricing from "./components/CheckoutPricing.vue";
import CheckoutErrors from "./components/CheckoutErrors.vue";

// --- templates
const supportedTemplates = {
  [CHECKOUT_TEMPLATE.FULL]: defineAsyncComponent(
    () => import("./templates/CheckoutFull.template.vue")
  ),
  [CHECKOUT_TEMPLATE.TWO_COLUMN_LTR]: defineAsyncComponent(
    () => import("./templates/CheckoutLTR.template.vue")
  ),
  [CHECKOUT_TEMPLATE.TWO_COLUMN_RTL]: defineAsyncComponent(
    () => import("./templates/CheckoutRTL.template.vue")
  ),
  [CHECKOUT_TEMPLATE.ENCLOSED]: defineAsyncComponent(
    () => import("./templates/CheckoutEnclosed.template.vue")
  )
};

// --- types
import { CHECKOUT_TEMPLATE } from "./types";
import { get, isEqual, includes } from "lodash-es";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    template?: CHECKOUT_TEMPLATE;
    hideSlots?: string[];
    editRoute: RouteLocationAsRelativeGeneric;
    storefrontRoute?: RouteLocationAsRelativeGeneric;
  }>(),
  {
    template: CHECKOUT_TEMPLATE.TWO_COLUMN_LTR,
    hideSlots: () => []
  }
);

const { navigateNext, navigateBack } = useRoutingEngine();
const { attempts, meta, isReady, uischema, invoice, reset } = useBasket();

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const templateVariant = computed(() =>
  get(
    supportedTemplates,
    props.template,
    supportedTemplates[CHECKOUT_TEMPLATE.TWO_COLUMN_LTR]
  )
);

// -----------------------------------------------------------------------------

await isReady();

const { dataLayer } = useDataLayer();
dataLayer({ event: "begin_checkout" }).withEcommerce().push();

// -----------------------------------------------------------------------------

// --- side effects

watch(attempts, (value, oldValue) => {
  // scroll to our errors when we have a new failed attempt
  if (value && !isEqual(value, oldValue)) {
    // scroll to relevant section IF we have errors there AND that section is enabled

    if (uischema.value.showProductsOnCheckout && !meta.value.hasProducts) {
      document
        .getElementById("basket-products")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (uischema.value.showFieldsOnCheckout && !meta.value.hasFields) {
      document
        .getElementById("basket-fields")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (uischema.value.showBillingOnCheckout && !meta.value.hasBilling) {
      document
        .getElementById("basket-billing")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // otherwise scroll to top where our general errors are
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

watch(meta, ({ isComplete }, { isComplete: wasComplete }) => {
  if (isComplete && !wasComplete) {
    navigateNext(invoice.value);
  }
});

onUnmounted(() => {
  if (meta.value.isComplete) reset();
  useFooter({});
  useHeader({});
});
</script>
