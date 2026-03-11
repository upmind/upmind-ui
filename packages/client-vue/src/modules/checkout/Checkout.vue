<template>
  <Transitions>
    <component :is="templateVariant">
      <template #back>
        <slot name="back">
          <Back v-show="showCheckout" @click.prevent="navigateBack" />
        </slot>
      </template>

      <template v-if="!isSlotHidden('summary')" #summary>
        <slot name="summary">
          <CheckoutSummary v-show="showCheckout" :template="props.template" />
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
          <CheckoutPricing v-show="showCheckout" />
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
            data-testid="slots:summary-append"
            :model-value="data.trustMessagingMarkdown"
          />
        </slot>
      </template>
    </component>

    <template v-if="meta.hasErrors" #errors>
      <slot name="errors">
        <CheckoutErrors v-show="showCheckout" />
      </slot>
    </template>
  </Transitions>

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
import { useConfig, validateTemplate } from "@upmind-automation/headless";
import { useThemes, Markdown } from "@upmind-automation/upmind-ui";

// --- components
import Back from "../../components/navigation/Back.vue";
import Transitions from "../../components/layout/components/transition/Transition.vue";
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
import { UIContext } from "@upmind-automation/headless";
import { get, isEqual, includes } from "lodash-es";
import type { StorefrontRoute } from "../../types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

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

const { set } = useThemes();
const { navigateNext, navigateBack } = useRoutingEngine();
const { attempts, meta, isReady, uischema, invoice, reset } = useBasket();

const { ui, data } = useConfig({
  context: UIContext.CHECKOUT,
  provide: true
});

set(ui.theme.value);

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const showCheckout = computed(
  () => !meta.value.isCheckout && !meta.value.isComplete
);

const template = computed(() =>
  validateTemplate(
    ui.template.value || props.template,
    CHECKOUT_TEMPLATE,
    CHECKOUT_TEMPLATE.TWO_COLUMN_LTR
  )
);

const templateVariant = computed(() => get(supportedTemplates, template.value));

// -----------------------------------------------------------------------------

await isReady().then(() => {
  const { dataLayer } = useDataLayer();
  dataLayer({ event: "begin_checkout" }).withEcommerce().push();
});

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
