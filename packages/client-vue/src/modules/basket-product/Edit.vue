<template>
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
        />
        <ProductHeroSkeleton v-else />
      </slot>
    </template>

    <template #image>
      <ProductImage
        v-if="product?.productDetails"
        :product-details="product.productDetails"
        :images="product.productDetails?.images"
      />
    </template>

    <template #configuration>
      <slot
        name="configuration"
        :basket-product="basketProduct"
        :meta="meta"
        :config-meta="meta"
        :do-resolve="doResolve"
        :do-reject="doReject"
      >
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
      </slot>
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
</template>

<script lang="ts" setup>
// --- external
import { computed, defineAsyncComponent, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useRoutingEngine,
  useBasketProducts,
  useQueryParams,
  useProductConfig
} from "@upmind-automation/headless";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useLayout } from "../../components/layout/useLayout";

// --- utils
import { isMobile } from "@upmind-automation/upmind-ui";

// --- components
import { Breadcrumb } from "@upmind-automation/upmind-ui";
import ConfigSkeleton from "../product/components/ConfigSkeleton.vue";
import ProductHero from "../product/components/hero/ProductHero.vue";
import ProductHeroSkeleton from "../product/components/hero/ProductHeroSkeleton.vue";
import ProductImage from "../product/components/hero/ProductImage.vue";
import ProductConfig from "../product/components/config/Config.vue";
import Section from "../../components/section/Section.vue";
import Pricing from "../product/components/pricing-list/Pricing.vue";
import PricingSkeleton from "../product/components/pricing-list/PricingSkeleton.vue";
import BasketActions from "./components/BasketActions.vue";
import ConfigErrors from "../product/components/ConfigErrors.vue";
import ProductNotFound from "../product/NotFound.vue";
import PricingMarkdown from "../product/components/pricing-list/PricingMarkdown.vue";
import PricingTotal from "../product/components/pricing-list/PricingTotal.vue";

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
import { get, includes } from "lodash-es";

// --- types
import type { BasketProductEditProps } from "./types";
import { BASKET_PRODUCT_TEMPLATE } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BasketProductEditProps>(), {
  template: BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL,
  hideSlots: () => []
});

const { t } = useI18n();

const { navigateBack, navigateNext } = useRoutingEngine();
const { isReady } = useBasket();
const { basketProductId } = useQueryParams();
const { configure } = useBasketProducts();

await isReady();

const {
  stop,
  update,
  service: basketProduct,
  onDone
} = await configure(basketProductId);

const {
  meta,
  product,
  model,
  terms,
  updateQuantity,
  updateTerm,
  productImage
} = useProductConfig(basketProduct);

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const templateVariant = computed(() =>
  get(
    supportedTemplates,
    props.template,
    supportedTemplates[BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL]
  )
);

async function doResolve() {
  update()
    .then(() => navigateNext(basketProduct))
    .catch(() => {
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
