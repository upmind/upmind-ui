<template>
  <component :is="templateVariant">
    <template #back>
      <slot name="back">
        <Back
          v-show="showCheckout"
          :label="backLabel"
          :icon="backIcon"
          @click.prevent="navigateBack"
        />
      </slot>
    </template>

    <template v-if="!isSlotHidden('summary')" #summary>
      <slot name="summary">
        <CheckoutHero v-show="showCheckout" :template="props.template" />
      </slot>
    </template>

    <template #content>
      <slot name="content">
        <CheckoutContent
          :show-checkout="showCheckout"
          :edit-route="props.editRoute"
          :billing-route="props.billingRoute"
          :fields-route="props.fieldsRoute"
        />
      </slot>
    </template>

    <template #pricing>
      <slot name="pricing">
        <CheckoutPricing
          v-show="showCheckout"
          :edit-route="summaryProductRoute"
        />
      </slot>
    </template>

    <template
      v-if="
        ui.trustMessaging.isVisible &&
        showCheckout &&
        data.trustMessagingMarkdown
      "
      #markdown
    >
      <slot name="markdown">
        <Markdown
          v-bind="summaryAppendTestAttrs"
          :model-value="data.trustMessagingMarkdown"
        />
      </slot>
    </template>
    <template v-if="meta.hasErrors" #errors>
      <slot name="errors">
        <CheckoutErrors v-show="showCheckout" />
      </slot>
    </template>
  </component>

  <slot name="processing" v-if="meta.isCheckout">
    <CheckoutProcessing />
  </slot>
</template>

<script lang="ts" setup>
import { useTestAttrs } from "@upmind/ui";
import { Markdown } from "@upmind/ui";
import { watch, computed, provide, onUnmounted, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  useBasket,
  useRoutingEngine,
  useDataLayer
} from "@upmind-automation/headless";
import { useConfig, validateTemplate } from "@upmind-automation/headless";
import { UIContext } from "@upmind-automation/headless";
import Back from "../../components/navigation/Back.vue";
import { useThemes } from "../theming";
import CheckoutContent from "./components/CheckoutContent.vue";
import CheckoutErrors from "./components/CheckoutErrors.vue";
import CheckoutHero from "./components/CheckoutHero.vue";
import CheckoutPricing from "./components/CheckoutPricing.vue";
import CheckoutProcessing from "./components/CheckoutProcessing.vue";
import CheckoutEnclosedTemplate from "./templates/CheckoutEnclosed.template.vue";
import CheckoutFullTemplate from "./templates/CheckoutFull.template.vue";
import CheckoutInsetTemplate from "./templates/CheckoutInset.template.vue";
import CheckoutLTRTemplate from "./templates/CheckoutLTR.template.vue";
import CheckoutRTLTemplate from "./templates/CheckoutRTL.template.vue";
import { CHECKOUT_TEMPLATE } from "./types";
import { get, isEqual, includes } from "lodash-es";
import type { StorefrontRoute } from "../../types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

const supportedTemplates = {
  [CHECKOUT_TEMPLATE.FULL]: CheckoutFullTemplate,
  [CHECKOUT_TEMPLATE.TWO_COLUMN_LTR]: CheckoutLTRTemplate,
  [CHECKOUT_TEMPLATE.TWO_COLUMN_RTL]: CheckoutRTLTemplate,
  [CHECKOUT_TEMPLATE.ENCLOSED]: CheckoutEnclosedTemplate,
  [CHECKOUT_TEMPLATE.INSET]: CheckoutInsetTemplate
};

/* Fallthrough onto Markdown's root; stripped from PROD builds at the source. */
const summaryAppendTestAttrs = useTestAttrs({ key: "slots:summary-append" });

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    template?: CHECKOUT_TEMPLATE;
    hideSlots?: string[];
    editRoute: RouteLocationAsRelativeGeneric;
    billingRoute: RouteLocationAsRelativeGeneric;
    fieldsRoute?: RouteLocationAsRelativeGeneric;
    storefrontRoute?: StorefrontRoute;
  }>(),
  {
    hideSlots: () => []
  }
);

const { t } = useI18n();
const { set } = useThemes();
const { navigateNext, navigateBack } = useRoutingEngine();
const {
  attempts,
  cancelChallenge,
  meta,
  isReady: _isReady,
  uischema,
  invoice,
  renderChallenge,
  reset
} = useBasket();

provide("usePaymentChallenge", { renderChallenge, cancelChallenge, meta });

const { ui, data } = useConfig({
  context: UIContext.CHECKOUT,
  provide: true
});
set(ui.theme.value);

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const showCheckout = computed(
  () => !meta.value.isCheckout && !meta.value.isComplete
);

// Everything below derives from the template, not the flow.
const template = computed(() =>
  validateTemplate(
    ui.template.value || props.template,
    CHECKOUT_TEMPLATE,
    CHECKOUT_TEMPLATE.TWO_COLUMN_LTR
  )
);

// An itemised summary links its products back to the basket step, where they're
// configured; a plain totals summary has nothing to link.
const summaryProductRoute = computed(() => {
  if (ui.basketSummaryDetails.isVisible) return props.fieldsRoute;
  return undefined;
});

// One-page uses a compact "Back" with a leading arrow per the designs; other
// templates keep the default "Back to basket" (no icon).
const backLabel = computed(() => {
  if (template.value === CHECKOUT_TEMPLATE.INSET) return t("action.back");
  return undefined;
});
const backIcon = computed(() => {
  if (template.value === CHECKOUT_TEMPLATE.INSET) return "arrow-narrow-left";
  return undefined;
});

const templateVariant = computed(() => get(supportedTemplates, template.value));

// ----------------------------------------------------------------------------

// --- side effects

watch(attempts, (value, oldValue) => {
  // A refused Place Order (the machine's canCheckout said no) scrolls to the
  // first incomplete section the page actually renders. Sections gated purely
  // by greying (product setup) never refuse — payment stays disabled instead.
  if (value && !isEqual(value, oldValue)) {
    // Gate on the SAME condition the section actually renders with
    // (CheckoutContent v-show), so a refusal never scrolls to a hidden section.
    const productsShown = ui.basketItems.isVisible;
    if (productsShown && !meta.value.hasProducts) {
      document
        .getElementById("basket-products")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // the fields form renders when the brand shows it at checkout (legacy
    // @display flag or the basketFields config); otherwise the alerts at the
    // top carry the review link back to where the fields live
    const fieldsShown = ui.basketFields.isVisible;
    if (fieldsShown && !meta.value.hasFields) {
      document
        .getElementById("basket-fields")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (uischema.value.showBillingOnCheckout && !meta.value.hasBilling) {
      document
        .getElementById("checkout-billing")
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

onMounted(() => {
  const { dataLayer } = useDataLayer();
  dataLayer({ event: "begin_checkout" }).withEcommerce().push();
});

onUnmounted(() => {
  if (meta.value.isComplete) reset();
});
</script>
