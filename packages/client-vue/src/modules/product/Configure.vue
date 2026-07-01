<template>
  <component :is="templateVariant">
    <template v-if="!isSlotHidden('product-details')" #product-details>
      <slot
        name="product-details"
        :product-meta="productMeta"
        :config-meta="configMeta"
        :product="product"
        :product-image="productImage"
      >
        <ProductHero
          v-if="productMeta?.isAvailable && product?.productDetails"
          :product-details="product.productDetails"
          :direction="stylesMeta.direction"
          :image="stylesMeta.heroImage"
          :meta="configMeta"
        >
          <template #prepend>
            <Breadcrumb
              v-if="productMeta?.isAvailable"
              :items="breadcrumbItems"
              :variant="configMeta.ui.breadcrumbs.value"
              size="lg"
            />
          </template>
        </ProductHero>
        <ProductHeroSkeleton v-else />
      </slot>
    </template>

    <template #image>
      <ProductImage
        v-if="
          product?.productDetails &&
          configMeta.ui.productImages.isVisible &&
          (!isEmpty(product.productDetails?.images) ||
            product.productDetails.imgUrl)
        "
        :product-details="product.productDetails"
        :images="product.productDetails?.images"
      />
    </template>

    <template #configuration>
      <Section
        :label="t('text.product_configuration')"
        value="product-configuration"
        icon="settings-04"
        :actions="configurationActions"
      >
        <slot
          name="configuration"
          :product="product"
          :pending-product="pendingProduct"
          :config-meta="configMeta"
          :product-meta="productMeta"
          :do-resolve="doResolve"
          :do-reject="doReject"
        >
          <form @submit.prevent @reset.prevent>
            <ProductConfig
              v-if="pendingProduct && productMeta?.isAvailable"
              as="fieldset"
              :item="pendingProduct"
              :model-value="pendingProduct?.id"
              :meta="configMeta"
              no-footer
              :hide-terms="hideTerms"
              @resolve="doResolve"
              @reject="doReject"
            />

            <ProductNotFound
              v-else-if="productMeta?.isUnavailable"
              :storefront-route="props.storefrontRoute"
            />

            <ConfigSkeleton v-else />
          </form>
        </slot>
      </Section>
    </template>

    <template #pricing>
      <Section
        :label="t('text.configuration_summary')"
        icon="shopping-bag-02"
        :class="styles.product.summary"
      >
        <slot
          name="pricing"
          :product="product"
          :model="model"
          :terms="terms"
          :product-meta="productMeta"
          :config-meta="configMeta"
          :do-resolve="doResolve"
          :update-quantity="updateQuantity"
          :update-term="updateTerm"
        >
          <Pricing
            v-if="product && productMeta?.isAvailable"
            :product="product"
            :meta="productMeta"
            :template="props.template"
            :total="stylesMeta.showTotal"
            :title="configMeta.data.productName || product.productDetails.title"
            :options="configMeta.ui.productConfigOptionsSummary.isVisible"
            :fields="configMeta.ui.productConfigFieldsSummary.isVisible"
          />

          <PricingSkeleton v-else />

          <slot
            v-if="template === PRODUCT_TEMPLATE.TWO_COLUMN_LTR && !isMobile"
            name="actions"
            :product="product"
            :config-meta="configMeta"
            :product-meta="productMeta"
            :template="props.template"
            :do-resolve="doResolve"
            :update-quantity="updateQuantity"
          >
            <ProductActions
              v-if="product && productMeta?.isAvailable"
              :product="product"
              :meta="productMeta"
              :template="props.template"
              @resolve="doResolve"
              @update:quantity="updateQuantity"
            />
          </slot>
        </slot>
      </Section>
    </template>

    <template
      v-if="
        configMeta.ui.trustMessaging.isVisible &&
        configMeta.data.trustMessagingMarkdown
      "
      #markdown
    >
      <slot
        name="markdown"
        :product="product"
        :config-meta="configMeta"
        :product-meta="productMeta"
      >
        <Markdown
          v-if="product?.productDetails"
          data-testid="slots:summary-append"
          :model-value="configMeta.data.trustMessagingMarkdown"
        />
      </slot>
    </template>

    <template #actions>
      <slot
        name="actions"
        :product="product"
        :config-meta="configMeta"
        :product-meta="productMeta"
        :template="props.template"
        :do-resolve="doResolve"
        :update-quantity="updateQuantity"
      >
        <ProductActions
          v-if="product && productMeta?.isAvailable"
          :product="product"
          :meta="productMeta"
          :template="props.template"
          @resolve="doResolve"
          @update:quantity="updateQuantity"
        />
      </slot>
    </template>

    <template #errors>
      <Alert
        class="w-full"
        v-if="externalErrors?.message"
        color="danger"
        variant="muted"
        icon="alert-triangle"
        :title="externalErrors?.message"
      />
      <ConfigErrors
        :visible="productMeta?.showErrors"
        :errors="validationErrors"
      />
    </template>

    <template #total>
      <PricingTotal
        v-if="product && productMeta?.isAvailable"
        :pricing="product.pricing"
        footer
      />
    </template>

    <template #terms>
      <slot name="terms" />
    </template>
  </component>
</template>

<script lang="ts" setup>
import { useClipboard } from "@vueuse/core";
import { computed, onUnmounted, provide, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  useRoutingEngine,
  useBasketProductsPending,
  useQueryParams,
  useProductConfig,
  UIContext,
  type ProductDetails,
  DetailedError,
  responseCodes,
  ErrorOrigin
} from "@upmind-automation/headless";
import { useConfig, validateTemplate } from "@upmind-automation/headless";
import { BreadcrumbVariant } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import { useThemes } from "@upmind-automation/upmind-ui";
import { Breadcrumb, Markdown, Alert } from "@upmind-automation/upmind-ui";
import { isMobile } from "@upmind-automation/upmind-ui";
import Section from "../../components/section/Section.vue";
import { useBreadcrumbs } from "../../composables/useBreadcrumbs";
import { PRODUCT_HERO_DIRECTION } from "../product/components/hero/types";
import ProductConfig from "./components/Config.vue";
import ConfigErrors from "./components/ConfigErrors.vue";
import ConfigSkeleton from "./components/ConfigSkeleton.vue";
import ProductHero from "./components/hero/ProductHero.vue";
import ProductHeroSkeleton from "./components/hero/ProductHeroSkeleton.vue";
import ProductImage from "./components/hero/ProductImage.vue";
import Pricing from "./components/pricing-list/Pricing.vue";
import PricingSkeleton from "./components/pricing-list/PricingSkeleton.vue";
import PricingTotal from "./components/pricing-list/PricingTotal.vue";
import ProductActions from "./components/ProductActions.vue";
import ProductNotFound from "./NotFound.vue";
import config from "./product.config";
import ProductEnclosedTemplate from "./templates/ProductEnclosed.template.vue";
import ProductFullTemplate from "./templates/ProductFull.template.vue";
import ProductLTRTemplate from "./templates/ProductLTR.template.vue";
import ProductRTLTemplate from "./templates/ProductRTL.template.vue";
import { PRODUCT_TEMPLATE } from "./types";
import { get, includes, take, isEmpty } from "lodash-es";
import type { ConfigureProps } from "./types";

const supportedTemplates = {
  [PRODUCT_TEMPLATE.FULL]: ProductFullTemplate,
  [PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: ProductLTRTemplate,
  [PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: ProductRTLTemplate,
  [PRODUCT_TEMPLATE.ENCLOSED]: ProductEnclosedTemplate
};

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<ConfigureProps>(), {
  hideSlots: () => []
});

const { t } = useI18n();
const { set } = useThemes();

const { navigateBack, navigateNext } = useRoutingEngine();
const { configure, resolve, remove } = useBasketProductsPending();
const { productId } = useQueryParams();
const { copy, copied, isSupported } = useClipboard({ legacy: true });

const {
  update,
  service: pendingProduct,
  onDone,
  isReady
} = await configure(productId);

const productConfig = useProductConfig(pendingProduct);
if (!productConfig)
  throw new DetailedError(
    t("error.product_not_available"),
    responseCodes.Service_Unavailable,
    ErrorOrigin.Headless
  );

provide("useProductConfig", productConfig);

const {
  meta: productMeta,
  model,
  product,
  externalErrors,
  validationErrors,
  productImage,
  updateQuantity,
  updateTerm,
  terms,
  shareUrl
} = productConfig;

const configMeta = useConfig({
  context: UIContext.CONFIGURE,
  product: () => product.value,
  provide: true
});

await isReady();

set(configMeta.ui.theme.value);

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const template = computed(() =>
  validateTemplate(
    configMeta.ui.template.value || props.template,
    PRODUCT_TEMPLATE,
    PRODUCT_TEMPLATE.TWO_COLUMN_RTL
  )
);

const templateVariant = computed(() => get(supportedTemplates, template.value));

const stylesMeta = computed(() => {
  return {
    breadcrumbs: configMeta.ui.breadcrumbs.value as BreadcrumbVariant,
    direction:
      template.value === PRODUCT_TEMPLATE.TWO_COLUMN_RTL
        ? PRODUCT_HERO_DIRECTION.VERTICAL
        : PRODUCT_HERO_DIRECTION.HORIZONTAL,
    heroImage:
      (template.value !== PRODUCT_TEMPLATE.TWO_COLUMN_LTR || isMobile.value) &&
      configMeta.ui.productImages.isVisible,
    showTotal:
      (template.value === PRODUCT_TEMPLATE.TWO_COLUMN_RTL && isMobile.value) ||
      template.value === PRODUCT_TEMPLATE.TWO_COLUMN_LTR ||
      template.value === PRODUCT_TEMPLATE.FULL
  };
});

const styles = useStyles("product", stylesMeta, config);

const { items: breadcrumbItems } = useBreadcrumbs({
  categories: () => {
    const breadcrumb = product.value?.productDetails?.breadcrumb ?? [];
    return stylesMeta.value?.breadcrumbs === BreadcrumbVariant.PARENT
      ? take(breadcrumb, 1)
      : breadcrumb;
  },
  route: () => props.catalogueRoute,
  storefrontRoute: () => props.storefrontRoute,
  variant: () => stylesMeta.value?.breadcrumbs,
  currentItem: () =>
    product.value?.productDetails &&
    stylesMeta.value?.breadcrumbs !== BreadcrumbVariant.PARENT
      ? { label: product.value.productDetails.title }
      : undefined
});

async function doResolve() {
  update()
    .then(() => {
      resolve(pendingProduct);
      navigateNext(pendingProduct);
    })
    .catch(error => {
      console.warn("Product Configuration Error", error);
      // if we take more than 60 seconds to resolve the product ( which is unlikely but possible),
      // add a failsafe to ensure the user is not stuck on the page and that we actually navigate away,
      // if the product is successfully added to the basket ( onDone = success)
      onDone().then(() => {
        resolve(pendingProduct);
        navigateNext(pendingProduct);
      });
    });
}

function doReject() {
  navigateBack();
}

const configurationActions = computed(() => {
  if (!isSupported.value) return [];
  return [
    {
      icon: copied.value ? "check" : "share-07",
      label: copied.value ? t("confirm.copied") : t("action.share"),
      handler: handleShare
    }
  ];
});

const handleShare = () => {
  copy(shareUrl.value || window.location.href);
};

onUnmounted(() => {
  remove(productId);
});

// Emit productDetails when it loads/changes for parent components (e.g., SEO, schema)
const emit = defineEmits<{
  productDetails: [payload: ProductDetails];
}>();

watch(
  () => product.value?.productDetails,
  value => {
    if (value) {
      emit("productDetails", value);
    }
  },
  { immediate: true }
);

defineExpose({ product: () => product.value?.productDetails });
</script>
