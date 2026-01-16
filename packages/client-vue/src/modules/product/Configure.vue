<template>
  <Transitions>
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
            :direction="
              template === PRODUCT_TEMPLATE.TWO_COLUMN_RTL
                ? 'vertical'
                : 'horizontal'
            "
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
        <slot
          name="configuration"
          :product="product"
          :pending-product="pendingProduct"
          :config-meta="configMeta"
          :product-meta="productMeta"
          :do-resolve="doResolve"
          :do-reject="doReject"
        >
          <Section :label="t('text.product_configuration')" icon="settings-04">
            <form @submit.prevent @reset.prevent>
              <ProductConfig
                v-if="pendingProduct && productMeta?.isAvailable"
                :item="pendingProduct"
                :model-value="pendingProduct?.id"
                :no-footer="true"
                :meta="configMeta"
                as="div"
                @resolve="doResolve"
                @reject="doReject"
              />

              <ProductNotFound
                v-else-if="productMeta?.isUnavailable"
                :storefront-route="props.storefrontRoute"
              />

              <ConfigSkeleton v-else />
            </form>

            <!-- <template #actions>
            <Share size="sm" />
          </template> -->
          </Section>
        </slot>
      </template>

      <template #pricing>
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
          <Section
            :label="t('text.configuration_summary')"
            icon="shopping-bag-02"
            :class="styles.product.summary"
          >
            <Pricing
              v-if="product && productMeta?.isAvailable"
              :product="product"
              :meta="productMeta"
              :template="props.template"
              :total="
                (template === PRODUCT_TEMPLATE.TWO_COLUMN_RTL && isMobile) ||
                template === PRODUCT_TEMPLATE.TWO_COLUMN_LTR ||
                template === PRODUCT_TEMPLATE.FULL
              "
              :title="
                configMeta.data.productName || product.productDetails.title
              "
              :options="configMeta.ui.productConfigOptionsSummary.isVisible"
              :fields="configMeta.ui.productConfigFieldsSummary.isVisible"
            />

            <PricingSkeleton v-else />
          </Section>
        </slot>
      </template>

      <template v-if="configMeta.ui.trustMessaging.isVisible" #markdown>
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
        <ConfigErrors v-if="productMeta?.isAvailable" :meta="productMeta" />
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
import { computed, defineAsyncComponent, onUnmounted, provide } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useRoutingEngine,
  useBasketProductsPending,
  useQueryParams,
  useProductConfig,
  UIContext
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./product.config";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useLayout } from "../../components/layout/useLayout";
import { useBreadcrumbs } from "../../composables/useBreadcrumbs";
import { useThemes } from "@upmind-automation/upmind-ui";

// --- components
import { Breadcrumb, Markdown } from "@upmind-automation/upmind-ui";
import ConfigErrors from "./components/ConfigErrors.vue";
import ConfigSkeleton from "./components/ConfigSkeleton.vue";
import Pricing from "./components/pricing-list/Pricing.vue";
import PricingSkeleton from "./components/pricing-list/PricingSkeleton.vue";
import PricingTotal from "./components/pricing-list/PricingTotal.vue";
import ProductActions from "./components/ProductActions.vue";
import ProductConfig from "./components/config/Config.vue";
import ProductHero from "./components/hero/ProductHero.vue";
import ProductHeroSkeleton from "./components/hero/ProductHeroSkeleton.vue";
import ProductImage from "./components/hero/ProductImage.vue";
import ProductNotFound from "./NotFound.vue";
import Section from "../../components/section/Section.vue";
import Transitions from "../../components/layout/components/transition/Transition.vue";

//  --- templates
const supportedTemplates = {
  [PRODUCT_TEMPLATE.FULL]: defineAsyncComponent(
    () => import("./templates/ProductFull.template.vue")
  ),
  [PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: defineAsyncComponent(
    () => import("./templates/ProductLTR.template.vue")
  ),
  [PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: defineAsyncComponent(
    () => import("./templates/ProductRTL.template.vue")
  ),
  [PRODUCT_TEMPLATE.ENCLOSED]: defineAsyncComponent(
    () => import("./templates/ProductEnclosed.template.vue")
  )
};
// --- utils
import { get, includes, take, isEmpty } from "lodash-es";
import { isMobile } from "@upmind-automation/upmind-ui";

// --- types
import { PRODUCT_TEMPLATE } from "./types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import { BreadcrumbVariant } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    storefrontRoute: RouteLocationAsRelativeGeneric;
    catalogueRoute?: RouteLocationAsRelativeGeneric;
    template?: PRODUCT_TEMPLATE;
    hideSlots?: string[];
  }>(),
  {
    hideSlots: () => []
  }
);

const { t } = useI18n();
const { set } = useThemes();

const { navigateBack, navigateNext } = useRoutingEngine();
const { configure, resolve, remove } = useBasketProductsPending();
const { productId } = useQueryParams();

const {
  stop,
  update,
  service: pendingProduct,
  onDone,
  isReady
} = await configure(productId);

const productConfig = useProductConfig(pendingProduct);
if (!productConfig) throw new Error("useProductConfig not provided");
provide("useProductConfig", productConfig);

const {
  meta: productMeta,
  model,
  product,
  productImage,
  updateQuantity,
  updateTerm,
  terms
} = productConfig;

const configMeta = useConfig({
  context: UIContext.CONFIGURE,
  product: () => product.value,
  provide: true
});

await isReady();

set(configMeta.ui.theme.value);

const isSlotHidden = (name: string) => includes(props.hideSlots, name);

const template = computed(() => props.template || configMeta.ui.template.value);

const templateVariant = computed(() =>
  get(
    supportedTemplates,
    template.value,
    supportedTemplates[PRODUCT_TEMPLATE.TWO_COLUMN_RTL]
  )
);

const stylesMeta = computed(() => {
  return {
    breadcrumbs: configMeta.ui.breadcrumbs.value as BreadcrumbVariant,
    heroImage:
      (template.value !== PRODUCT_TEMPLATE.TWO_COLUMN_LTR || isMobile.value) &&
      configMeta.ui.productImages.isVisible
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

onUnmounted(() => {
  remove(productId);

  useHeader({});
  useLayout({});
  useFooter({});
});
</script>
