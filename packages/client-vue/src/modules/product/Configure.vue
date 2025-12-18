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
              template === PRODUCT_TEMPLATE.TWO_COLUMN_RTL
                ? 'vertical'
                : 'horizontal'
            "
            :image="template !== PRODUCT_TEMPLATE.TWO_COLUMN_LTR || isMobile"
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
        <slot
          name="configuration"
          :product="product"
          :pending-product="pendingProduct"
          :meta="meta"
          :config-meta="configMeta"
          :do-resolve="doResolve"
          :do-reject="doReject"
        >
          <Section :label="t('text.product_configuration')" icon="settings-04">
            <form @submit.prevent @reset.prevent>
              <ProductConfig
                v-if="pendingProduct && meta?.isAvailable"
                :item="pendingProduct"
                :model-value="pendingProduct?.id"
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
          :meta="meta"
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
              v-if="product && meta?.isAvailable"
              :product="product"
              :template="props.template"
              :meta="meta"
              :total="
                (template === PRODUCT_TEMPLATE.TWO_COLUMN_RTL && isMobile) ||
                template === PRODUCT_TEMPLATE.TWO_COLUMN_LTR ||
                template === PRODUCT_TEMPLATE.FULL
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

      <template #terms>
        <slot name="terms" />
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

      <template #actions>
        <slot
          name="actions"
          :product="product"
          :meta="meta"
          :template="props.template"
          :do-resolve="doResolve"
          :update-quantity="updateQuantity"
        >
          <ProductActions
            v-if="product && meta?.isAvailable"
            :product="product"
            :meta="meta"
            :template="props.template"
            @resolve="doResolve"
            @update:quantity="updateQuantity"
          />
        </slot>
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
  useBasketProductsPending,
  useQueryParams,
  useProductConfig
} from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./product.config";
import { useHeader } from "../../components/header/useHeader";
import { useFooter } from "../../components/footer/useFooter";
import { useLayout } from "../../components/layout/useLayout";
import { useBreadcrumbs } from "../../composables/useBreadcrumbs";

// --- components
import { Breadcrumb } from "@upmind-automation/upmind-ui";
import ConfigErrors from "./components/ConfigErrors.vue";
import ConfigSkeleton from "./components/ConfigSkeleton.vue";
import Pricing from "./components/pricing-list/Pricing.vue";
import PricingMarkdown from "./components/pricing-list/PricingMarkdown.vue";
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
import { BreadcrumbVariant } from "@upmind-automation/headless";
import { PRODUCT_TEMPLATE } from "./types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    storefrontRoute: RouteLocationAsRelativeGeneric;
    catalogueRoute?: RouteLocationAsRelativeGeneric;
    template?: PRODUCT_TEMPLATE;
    hideSlots?: string[];
    defaultBreadcrumbVariant?: BreadcrumbVariant;
  }>(),
  {
    template: PRODUCT_TEMPLATE.TWO_COLUMN_RTL,
    hideSlots: () => []
  }
);

const { t } = useI18n();

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
    supportedTemplates[PRODUCT_TEMPLATE.TWO_COLUMN_RTL]
  )
);

const configMeta = computed(() => {
  return {
    breadcrumbs:
      product.value?.productDetails?.uiMeta?.uischema?.config?.breadcrumbs ??
      BreadcrumbVariant.CATEGORY
  };
});

const styles = useStyles("product", configMeta, config) as ComputedRef<{
  product: {
    summary: string;
  };
}>;

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
