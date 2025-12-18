<template>
  <Transitions>
    <component :is="templateVariant">
      <template v-if="!isSlotHidden('product-details')" #product-details>
        <slot
          name="product-details"
          :meta="meta"
          :product="product"
          :product-image="productImage"
        >
          <ProductHero
            v-if="meta?.isAvailable && product?.productDetails"
            :product-details="product.productDetails"
            :product-image="productImage()"
            :direction="
              template === BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL
                ? 'vertical'
                : 'horizontal'
            "
            :image="
              template !== BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_LTR || isMobile
            "
          >
            <template #prepend>
              <Breadcrumb
                v-if="meta?.isAvailable"
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
        <Section :label="t('text.product_configuration')" icon="settings-04">
          <form @submit.prevent @reset.prevent>
            <ProductConfig
              v-if="basketProduct && meta?.isAvailable"
              :item="basketProduct"
              :model-value="basketProduct?.id"
              :no-footer="true"
              as="div"
              @resolve="doResolve"
              @reject="doReject"
            />

            <ProductNotFound
              v-else-if="meta?.isUnavailable"
              :storefront-route="props.storefrontRoute"
            />

            <ConfigSkeleton v-else />
          </form>
        </Section>
      </template>

      <template #pricing>
        <slot
          name="pricing"
          :product="product"
          :model="model"
          :terms="terms"
          :meta="meta"
          :do-resolve="doResolve"
          :update-quantity="updateQuantity"
          :update-term="updateTerm"
        >
          <Section
            :label="t('text.configuration_summary')"
            icon="shopping-bag-02"
          >
            <Pricing
              v-if="product && meta?.isAvailable"
              :product="product"
              :meta="meta"
              :template="props.template"
              edit
              @resolve="doResolve"
              @update:quantity="updateQuantity"
              :total="
                (template === BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL &&
                  isMobile) ||
                template === BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_LTR ||
                template === BASKET_PRODUCT_TEMPLATE.FULL
              "
            />

            <PricingSkeleton v-else />
          </Section>
        </slot>
      </template>

      <template #markdown>
        <slot
          name="markdown"
          :product="product"
          :meta="meta"
          :do-resolve="doResolve"
        >
          <PricingMarkdown
            v-if="product && meta?.isAvailable"
            :product="product"
            @resolve="doResolve"
          />
        </slot>
      </template>

      <template #actions>
        <BasketActions
          v-if="product && meta?.isAvailable"
          :product="product"
          :meta="meta"
          :template="props.template"
          @resolve="doResolve"
          @update:quantity="updateQuantity"
        />
      </template>

      <template #errors>
        <ConfigErrors v-if="meta?.isAvailable" :meta="meta" />
      </template>

      <template #total>
        <PricingTotal
          v-if="product && meta?.isAvailable"
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
import {
  computed,
  defineAsyncComponent,
  onUnmounted,
  provide,
  type ComputedRef
} from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useRoutingEngine,
  useBasketProducts,
  useQueryParams,
  useProductConfig
} from "@upmind-automation/headless";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useLayout } from "../../components/layout/useLayout";
import { useBreadcrumbs } from "../../composables/useBreadcrumbs";

// --- components
import { Breadcrumb } from "@upmind-automation/upmind-ui";
import BasketActions from "./components/BasketActions.vue";
import ConfigErrors from "../product/components/ConfigErrors.vue";
import ConfigSkeleton from "../product/components/ConfigSkeleton.vue";
import Pricing from "../product/components/pricing-list/Pricing.vue";
import PricingMarkdown from "../product/components/pricing-list/PricingMarkdown.vue";
import PricingSkeleton from "../product/components/pricing-list/PricingSkeleton.vue";
import PricingTotal from "../product/components/pricing-list/PricingTotal.vue";
import ProductConfig from "../product/components/config/Config.vue";
import ProductHero from "../product/components/hero/ProductHero.vue";
import ProductHeroSkeleton from "../product/components/hero/ProductHeroSkeleton.vue";
import ProductImage from "../product/components/hero/ProductImage.vue";
import ProductNotFound from "../product/NotFound.vue";
import Section from "../../components/section/Section.vue";
import Transitions from "../../components/layout/components/transition/Transition.vue";

//  --- templates
const supportedTemplates = {
  [BASKET_PRODUCT_TEMPLATE.FULL]: defineAsyncComponent(
    () => import("./templates/BasketProductFull.template.vue")
  ),
  [BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: defineAsyncComponent(
    () => import("./templates/BasketProductLTR.template.vue")
  ),
  [BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: defineAsyncComponent(
    () => import("./templates/BasketProductRTL.template.vue")
  ),
  [BASKET_PRODUCT_TEMPLATE.ENCLOSED]: defineAsyncComponent(
    () => import("./templates/BasketProductEnclosed.template.vue")
  )
};
// --- utils
import { get, includes, take, isEmpty } from "lodash-es";
import { isMobile } from "@upmind-automation/upmind-ui";

// --- types
import { BreadcrumbVariant } from "@upmind-automation/headless";
import { BASKET_PRODUCT_TEMPLATE } from "./types";
import type { BasketProductEditProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketProductEditProps>(), {
  template: BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL,
  hideSlots: () => []
});

const { t } = useI18n();

const { navigateBack, navigateNext } = useRoutingEngine();

const { configure } = useBasketProducts();
const { basketProductId } = useQueryParams();

const {
  stop,
  update,
  service: basketProduct,
  onDone,
  isReady
} = await configure(basketProductId);

const productConfig = useProductConfig(basketProduct);
if (!productConfig) throw new Error("useProductConfig not provided");
provide("useProductConfig", productConfig);

const {
  meta,
  model,
  product,
  productImage,
  updateQuantity,
  updateTerm,
  terms
} = productConfig;

await isReady();

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const templateVariant = computed(() =>
  get(
    supportedTemplates,
    props.template,
    supportedTemplates[BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL]
  )
);

const configMeta = computed(() => {
  return {
    breadcrumbs:
      product.value?.productDetails?.uiMeta?.uischema?.config?.breadcrumbs ??
      BreadcrumbVariant.CATEGORY
  };
});

const { items: breadcrumbItems, variant: breadcrumbVariant } = useBreadcrumbs({
  categories: () => {
    const breadcrumb = product.value?.productDetails?.breadcrumb ?? [];
    return configMeta.value?.breadcrumbs === BreadcrumbVariant.CATEGORY
      ? take(breadcrumb, 1)
      : breadcrumb;
  },
  route: () => props.catalogueRoute,
  storefrontRoute: () => props.storefrontRoute,
  variant: () => configMeta.value?.breadcrumbs,
  currentItem: () =>
    product.value?.productDetails &&
    configMeta.value?.breadcrumbs !== BreadcrumbVariant.CATEGORY
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

onUnmounted(() => {
  stop();

  useHeader({});
  useLayout({});
  useFooter({});
});
</script>
