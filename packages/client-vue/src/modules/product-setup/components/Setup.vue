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
          <Loading :active="setupMeta.isLoading" class="min-h-44">
            <Section
              v-if="!setupMeta.isLoading"
              :label="currentProductTitle"
              icon="settings-04"
            >
              <slot name="errors">
                <Alert
                  v-if="externalErrors?.message || setupMeta?.hasError"
                  class="w-full"
                  color="danger"
                  variant="minimal"
                  icon="alert-triangle"
                  :title="t('error.product_setup')"
                  :description="externalErrors?.message || setupError?.message"
                />
              </slot>

              <form
                id="setup-form"
                @submit.prevent="doResolve"
                @reset.prevent
                autocomplete="on"
              >
                <Form
                  v-if="basketProduct && productMeta?.isAvailable"
                  :loading="productMeta.isLoading"
                  :processing="setupMeta.isProcessing"
                  :disabled="setupMeta.isProcessing"
                  :schema="schema"
                  :uischema="uischema"
                  :model-value="model"
                  :additional-errors="additionalErrors"
                  @update:modelValue="setConfig"
                  no-actions
                  as="fieldset"
                />
                <!-- <ConfigSkeleton v-else /> -->
              </form>
            </Section>
          </Loading>
        </slot>
      </template>

      <template #apply-to-others>
        <slot name="apply-to-others" :other-products="similarProducts">
          <ApplyToOthers
            v-if="setupMeta.hasSimilar && !setupMeta.isLoading"
            v-model="selected"
            :products="similarProducts"
            :loading="setupMeta.isLoading"
            :disabled="setupMeta.isProcessing"
          />
        </slot>
      </template>

      <template #content-header>
        <slot name="content-header">
          <section :class="styles.header.root">
            <div class="flex flex-col items-start gap-6">
              <Badge variant="muted" icon="lock-01">
                {{ t("text.fully_encrypted_title") }}
              </Badge>
              <Hero
                :title="t('cart.product_setup_title')"
                :ui-config="{
                  hero: {
                    title: [styles.header.heroTitle],
                    description: [styles.header.heroDescription]
                  }
                }"
              >
                <template #subtitle>
                  <p :class="styles.header.price">
                    {{ t("cart.product_setup_desc") }}
                  </p>
                </template>
              </Hero>
              <Button
                variant="outline"
                icon="arrow-left"
                :label="t('action.back_to_basket')"
                @click="doReject"
              />
            </div>
          </section>
        </slot>
      </template>

      <template #aside>
        <slot name="aside" />
      </template>

      <template #progress>
        <slot name="progress">
          <span v-if="total > 1" class="shrink-0 text-base font-semibold">
            {{ t("cart.product_setup_count", { count: total }) }}
          </span>
        </slot>
      </template>

      <template #actions>
        <slot
          name="actions"
          :do-resolve="doResolve"
          :do-reject="doReject"
          :is-processing="setupMeta?.isProcessing"
        >
          <Button
            v-if="!setupMeta?.isLoading"
            type="submit"
            form="setup-form"
            :label="t('action.continue_label')"
            :loading="setupMeta?.isProcessing"
            :disabled="
              productMeta?.isLoading ||
              productMeta?.isInvalid ||
              productMeta?.isUnavailable ||
              setupMeta?.isProcessing
            "
            color="primary"
            size="lg"
            class="w-full"
          />
        </slot>
      </template>
    </component>
  </Transitions>
</template>

<script lang="ts" setup>
// --- external
import { computed, defineAsyncComponent, onUnmounted, provide } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useProductConfig,
  useProductSetup,
  useConfig,
  validateTemplate,
  DetailedError,
  responseCodes,
  ErrorOrigin
} from "@upmind-automation/headless";

// --- components
import {
  Alert,
  Badge,
  Button,
  Loading,
  useStyles
} from "@upmind-automation/upmind-ui";
import Hero from "../../../components/hero/Hero.vue";
import Section from "../../../components/section/Section.vue";
import Form from "../../../components/form/Form.vue";
import ApplyToOthers from "./ApplyToOthers.vue";
import Transitions from "../../../components/layout/components/transition/Transition.vue";
import productHeroConfig from "../../product/components/hero/product-hero.config";

// --- templates
const supportedTemplates = {
  [PRODUCT_SETUP_TEMPLATE.FULL]: defineAsyncComponent(
    () => import("../templates/ProductSetupFull.template.vue")
  ),
  [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_LTR]: defineAsyncComponent(
    () => import("../templates/ProductSetupLTR.template.vue")
  ),
  [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_RTL]: defineAsyncComponent(
    () => import("../templates/ProductSetupRTL.template.vue")
  ),
  [PRODUCT_SETUP_TEMPLATE.ENCLOSED]: defineAsyncComponent(
    () => import("../templates/ProductSetupEnclosed.template.vue")
  )
};

// --- utils
import { get, size } from "lodash-es";

// --- types
import {
  UIContext,
  type ProductModel,
  type Product,
  type BasketProduct,
  type UseProductConfigMeta
} from "@upmind-automation/headless";
import type { ActorRef } from "xstate";
import { PRODUCT_SETUP_TEMPLATE, type ProductSetupProps } from "../types";

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
  resolve: [model: Partial<ProductModel>];
  reject: [];
}>();

defineSlots<{
  configuration(props: {
    product: Product | undefined;
    basketProduct: ActorRef<any, any> | undefined;
    productMeta: UseProductConfigMeta;
  }): void;
  "content-header"(): void;
  "apply-to-others"(props: { otherProducts: BasketProduct[] }): void;
  aside(): void;
  progress(): void;
  actions(props: {
    doResolve: () => void;
    doReject: () => void;
    isProcessing: boolean;
  }): void;
  errors(): void;
}>();

const { t } = useI18n();

// --- Styles (match ProductHero vertical direction like Edit page)
const stylesMeta = computed(() => ({
  direction: "vertical" as const,
  hasImage: false
}));

const styles = useStyles(
  ["header", "header.image"],
  stylesMeta,
  productHeroConfig
);

// --- Product Setup composable (singleton - shared with parent)
const {
  configure,
  error: setupError,
  meta: setupMeta,
  schema,
  uischema,
  selected,
  similarProducts,
  total
} = useProductSetup();

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

const {
  meta: productMeta,
  model,
  product,
  externalErrors,
  validationErrors,
  additionalErrors,
  setConfig
} = basketProductConfig;

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

// --- Actions
function doResolve() {
  if (!model.value || productMeta.value.isInvalid) return;
  emit("resolve", model.value);
}

function doReject() {
  emit("reject");
}
</script>
