<template>
  <Transitions>
    <component :is="templateVariant" :key="template">
      <template #configuration>
        <slot
          name="configuration"
          :product="product"
          :basket-product="basketProduct"
          :product-meta="productMeta"
        >
          <Loading
            :label="t('text.loading')"
            :active="setupMeta.isLoading"
            class="min-h-44"
          >
            <!-- Gate on hasSchema, NOT isLoading: a basket-processing tick
              (e.g. registering a domain in the SmartDomainField drawer) flips
              isLoading true and would unmount the form mid-flow, tearing down
              the open drawer + its DAC machine before the choice is committed.
              The Loading overlay + Form's :processing handle the in-flight UX. -->
            <Section
              v-if="setupMeta.hasSchema"
              :label="currentProductTitle"
              icon="settings-04"
            >
              <ProductSetupForm
                :bpid="props.bpid"
                @resolve="onFormResolve"
                @reject="doReject"
              >
                <template v-if="$slots.errors" #errors>
                  <slot name="errors" />
                </template>
              </ProductSetupForm>
            </Section>
          </Loading>
        </slot>
      </template>

      <template #content-header>
        <slot name="content-header">
          <Hero
            :title="t('cart.product_setup_title')"
            :description="t('cart.product_setup_desc')"
            :badge="{
              label: t('text.fully_encrypted_title'),
              icon: 'lock-04',
              variant: 'neutral',
              appearance: 'outline'
            }"
            :dataAttrs="{ 'data-test-key': 'product-setup-hero-title' }"
            :action="{
              label: t('action.back_to_basket'),
              icon: 'flip-backward',
              disabled: isNavigating,
              dataAttrs: { 'data-test-key': 'button-back-to-basket' }
            }"
            size="3xl"
            @action="doReject"
          />
        </slot>
      </template>

      <template #aside>
        <slot name="aside" />
      </template>

      <template #progress>
        <slot name="progress">
          <span
            v-if="total > 1"
            class="shrink-0 text-base font-semibold"
            v-bind="progressTestAttrs(total)"
          >
            {{ t("cart.product_setup_count", { count: total }) }}
          </span>
        </slot>
      </template>

      <template #actions>
        <slot
          name="actions"
          :do-reject="doReject"
          :is-processing="setupMeta?.isProcessing"
        >
          <Button
            v-if="!setupMeta?.isLoading"
            type="submit"
            form="setup-form"
            :loading="setupMeta?.isProcessing || isNavigating"
            :disabled="
              productMeta?.isLoading ||
              productMeta?.isInvalid ||
              productMeta?.isUnavailable ||
              setupMeta?.isProcessing
            "
            variant="primary"
            size="lg"
            class="w-full"
          >
            {{ t("action.continue_label") }}
          </Button>
        </slot>
      </template>
    </component>
  </Transitions>
</template>

<script lang="ts" setup>
import { computed, provide } from "vue";
import { useI18n } from "vue-i18n";
import {
  useProductConfig,
  useProductSetup,
  useConfig,
  useRoutingEngine,
  validateTemplate,
  DetailedError,
  responseCodes,
  ErrorOrigin
} from "@upmind-automation/headless";
import {
  UIContext,
  type Product,
  type UseProductConfigMeta
} from "@upmind-automation/headless";
import { useTestAttrs } from "@upmind/ui";
import { Button, Loading } from "@upmind/ui";
import Hero from "../../../components/hero/Hero.vue";
import Transitions from "../../../components/layout/components/transition/Transition.vue";
import Section from "../../../components/section/Section.vue";
import ProductSetupEnclosedTemplate from "../templates/ProductSetupEnclosed.template.vue";
import ProductSetupFullTemplate from "../templates/ProductSetupFull.template.vue";
import ProductSetupLTRTemplate from "../templates/ProductSetupLTR.template.vue";
import ProductSetupRTLTemplate from "../templates/ProductSetupRTL.template.vue";
import { PRODUCT_SETUP_TEMPLATE, type ProductSetupProps } from "../types";
import ProductSetupForm from "./ProductSetupForm.vue";
import { get } from "lodash-es";
import type { ActorRef } from "xstate";

const supportedTemplates = {
  [PRODUCT_SETUP_TEMPLATE.FULL]: ProductSetupFullTemplate,
  [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_LTR]: ProductSetupLTRTemplate,
  [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_RTL]: ProductSetupRTLTemplate,
  [PRODUCT_SETUP_TEMPLATE.ENCLOSED]: ProductSetupEnclosedTemplate
};

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<
    ProductSetupProps & {
      bpid: string;
    }
  >(),
  {
    hideSlots: () => []
  }
);

const emit = defineEmits<{
  resolve: [];
  reject: [];
}>();

defineSlots<{
  configuration(props: {
    product: Product | undefined;
    basketProduct: ActorRef<any, any> | undefined;
    productMeta: UseProductConfigMeta;
  }): void;
  "content-header"(): void;
  aside(): void;
  progress(): void;
  actions(props: { doReject: () => void; isProcessing: boolean }): void;
  errors(): void;
}>();

const { t } = useI18n();

// --- Product Setup composable (singleton - shared with parent)
// The form itself (schema/errors/apply-to-others/Continue) lives in the shared
// ProductSetupForm; this host keeps its own config wiring for the page chrome
// (title, slots, button gating) — useProductConfig is a pure wrapper over the
// same machine, so both reading it is safe.
const { configure, meta: setupMeta, total } = useProductSetup();

const { isNavigating } = useRoutingEngine();

const { service: basketProduct } = await configure(props.bpid);

const basketProductConfig = useProductConfig(basketProduct);

if (!basketProductConfig) {
  doReject();
  throw new DetailedError(
    t("error.product_not_available"),
    responseCodes.Service_Unavailable,
    ErrorOrigin.Headless
  );
}
provide("useProductConfig", basketProductConfig);

const { meta: productMeta, product } = basketProductConfig;

// --- Config context
const configMeta = useConfig({
  context: UIContext.CONFIGURE,
  product: () => product.value,
  provide: true
});

const template = computed(() =>
  validateTemplate(
    configMeta.ui.template.value || props.template,
    PRODUCT_SETUP_TEMPLATE,
    PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_RTL
  )
);

const templateVariant = computed(() => get(supportedTemplates, template.value));

const currentProductTitle = computed(() =>
  get(
    product.value,
    "serviceIdentifier",
    get(product.value, "productDetails.title", "")
  )
);

// --- Test attrs
const progressTestAttrs = (value: number) =>
  useTestAttrs({ key: "product-setup-progress", value: String(value) });

// --- Actions
function onFormResolve() {
  emit("resolve");
}

function doReject() {
  emit("reject");
}
</script>
