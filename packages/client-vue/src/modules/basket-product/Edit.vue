<template>
  <Transitions>
    <component :is="templateVariant">
      <template v-if="!isSlotHidden('product-details')" #product-details>
        <slot
          name="product-details"
          :config-meta="configMeta"
          :product="product"
          :product-image="productImage"
        >
          <ProductHero
            v-if="productMeta?.isAvailable && product?.productDetails"
            :product-details="product.productDetails"
            :product-image="productImage()"
            :direction="stylesMeta.direction"
            :image="stylesMeta.heroImage"
            :meta="configMeta"
          >
            <template #prepend>
              <Breadcrumb
                v-if="productMeta?.isAvailable"
                :items="breadcrumbItems"
                :variant="breadcrumbVariant"
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
            (!isEmpty(product.productDetails?.images) ||
              product.productDetails.imgUrl)
          "
          :product-details="product.productDetails"
          :images="product.productDetails?.images"
        />
      </template>

      <template #configuration>
        <slot
          name="configuration"
          :product="product"
          :basket-product="basketProduct"
          :product-meta="productMeta"
          :config-meta="configMeta"
          :do-resolve="doResolve"
          :do-reject="doReject"
        >
          <Section
            :label="t('text.product_configuration')"
            icon="settings-04"
            :actions="configurationActions"
          >
            <form @submit.prevent @reset.prevent>
              <ProductConfig
                v-if="basketProduct && productMeta?.isAvailable"
                :meta="configMeta"
                :touched="productMeta?.showErrors"
                :item="basketProduct"
                :model-value="basketProduct?.id"
                :hide-terms="props.hideTerms"
                :no-footer="true"
                as="fieldset"
                @resolve="doResolve"
                @reject="doReject"
              />

              <ProductNotFound
                v-else-if="productMeta?.isUnavailable"
                :storefront-route="props.storefrontRoute"
              />

              <ConfigSkeleton v-else />
            </form>
          </Section>
        </slot>
      </template>

      <template #pricing>
        <Section
          :label="t('text.configuration_summary')"
          icon="shopping-bag-02"
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
              :title="
                configMeta.data.productName || product.productDetails.title
              "
              :options="configMeta.ui.productConfigOptionsSummary.isVisible"
              :fields="configMeta.ui.productConfigFieldsSummary.isVisible"
            />

            <PricingSkeleton v-else />

            <slot
              v-if="
                template === BASKET_PRODUCT_TEMPLATE.INSET ||
                (template === BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_LTR &&
                  !isMobile)
              "
              name="actions"
              :product="product"
              :config-meta="configMeta"
              :product-meta="productMeta"
              :template="props.template"
              :do-resolve="doResolve"
              :update-quantity="updateQuantity"
            >
              <BasketActions
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
          :template="props.template"
          :do-resolve="doResolve"
          :update-quantity="updateQuantity"
        >
          <BasketActions
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
          v-if="productMeta?.isLocked"
          color="neutral"
          variant="minimal"
          icon="lock-01"
          :title="t('error.basket_product_readonly')"
        />
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
  </Transitions>
</template>

<script lang="ts" setup>
// --- external
import { computed, provide, watch, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useRoutingEngine,
  useBasketProducts,
  useQueryParams,
  useProductConfig,
  type ProductDetails,
  DetailedError,
  responseCodes,
  ErrorOrigin
} from "@upmind-automation/headless";
import { useBreadcrumbs } from "../../composables/useBreadcrumbs";
import { useConfig, validateTemplate } from "@upmind-automation/headless";

// --- components
import { Breadcrumb, Markdown, Alert } from "@upmind-automation/upmind-ui";
import BasketActions from "./components/BasketActions.vue";
import ConfigErrors from "../product/components/ConfigErrors.vue";
import ConfigSkeleton from "../product/components/ConfigSkeleton.vue";
import Pricing from "../product/components/pricing-list/Pricing.vue";
import PricingSkeleton from "../product/components/pricing-list/PricingSkeleton.vue";
import PricingTotal from "../product/components/pricing-list/PricingTotal.vue";
import ProductConfig from "../product/components/Config.vue";
import ProductHero from "../product/components/hero/ProductHero.vue";
import ProductHeroSkeleton from "../product/components/hero/ProductHeroSkeleton.vue";
import ProductImage from "../product/components/hero/ProductImage.vue";
import ProductNotFound from "../product/NotFound.vue";
import Section from "../../components/section/Section.vue";
import Transitions from "../../components/layout/components/transition/Transition.vue";

//  --- templates
import BasketProductFullTemplate from "./templates/BasketProductFull.template.vue";
import BasketProductLTRTemplate from "./templates/BasketProductLTR.template.vue";
import BasketProductRTLTemplate from "./templates/BasketProductRTL.template.vue";
import BasketProductEnclosedTemplate from "./templates/BasketProductEnclosed.template.vue";
import BasketProductInsetTemplate from "./templates/BasketProductInset.template.vue";

const supportedTemplates = {
  [BASKET_PRODUCT_TEMPLATE.FULL]: BasketProductFullTemplate,
  [BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: BasketProductLTRTemplate,
  [BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: BasketProductRTLTemplate,
  [BASKET_PRODUCT_TEMPLATE.ENCLOSED]: BasketProductEnclosedTemplate,
  [BASKET_PRODUCT_TEMPLATE.INSET]: BasketProductInsetTemplate
};
// --- utils
import { get, includes, take, isEmpty } from "lodash-es";
import { isMobile, useThemes } from "@upmind-automation/upmind-ui";
import { useClipboard } from "@vueuse/core";

// --- types
import { BreadcrumbVariant, UIContext } from "@upmind-automation/headless";
import { BASKET_PRODUCT_TEMPLATE } from "./types";
import type { BasketProductEditProps } from "./types";
import { PRODUCT_HERO_DIRECTION } from "../product/components/hero/types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketProductEditProps>(), {
  hideSlots: () => []
});

const { t } = useI18n();
const { set } = useThemes();

const { navigateBack, navigateNext } = useRoutingEngine();
const { configure } = useBasketProducts();
const { basketProductId } = useQueryParams();
const { copy, copied, isSupported } = useClipboard({ legacy: true });

const {
  stop,
  update,
  service: basketProduct,
  onDone,
  isReady
} = await configure(basketProductId, { allowMultipleEdits: true });

const productConfig = useProductConfig(basketProduct);

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
    BASKET_PRODUCT_TEMPLATE,
    BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL
  )
);

const templateVariant = computed(() => get(supportedTemplates, template.value));

const stylesMeta = computed(() => {
  return {
    breadcrumbs: configMeta.ui.breadcrumbs.value as BreadcrumbVariant,
    direction:
      template.value === BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL
        ? PRODUCT_HERO_DIRECTION.VERTICAL
        : PRODUCT_HERO_DIRECTION.HORIZONTAL,
    heroImage:
      (template.value !== BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_LTR ||
        isMobile.value) &&
      configMeta.ui.productImages.isVisible,
    showTotal:
      (template.value === BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL &&
        isMobile.value) ||
      template.value === BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_LTR ||
      template.value === BASKET_PRODUCT_TEMPLATE.FULL ||
      template.value === BASKET_PRODUCT_TEMPLATE.INSET
  };
});

const { items: breadcrumbItems, variant: breadcrumbVariant } = useBreadcrumbs({
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
    .then(() => navigateNext(basketProduct))
    .catch(error => {
      console.warn("Product Configuration Error", error);
      // if we take more than 60 seconds to resolve the product ( which is unlikely but possible),
      // add a failsafe to ensure the user is not stuck on the page and that we actually navigate away,
      // if the product is successfully added to the basket ( onDone = success)
      onDone().then(() => {
        navigateNext(basketProduct);
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
