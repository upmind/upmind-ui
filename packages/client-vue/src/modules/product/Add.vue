<template>
  <Layout :variant="configMeta.layout" minimal>
    <template #navigation>
      <Breadcrumb :items="items" size="lg" v-if="meta?.isAvailable" />
    </template>

    <template #actions>
      <Share class="hidden md:flex" v-if="meta?.isAvailable" />
    </template>

    <template #header>
      <Header
        v-bind="product"
        :product-image="productImage()"
        v-if="meta?.isAvailable"
      />
      <HeaderSkeleton v-else />
    </template>

    <template #default>
      <Section :title="meta?.isAvailable ? t('product.configure') : ''">
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

          <ProductNotFound v-else-if="meta?.isUnavailable" />

          <ConfigSkeleton v-else />
        </form>
      </Section>
    </template>

    <template #aside>
      <Section
        :title="t('product.summary.title')"
        :class="styles.product.summary"
        aside
      >
        <Summary
          v-if="product && meta?.isAvailable"
          :product="product"
          :meta="meta"
          @resolve="doResolve"
          @update:quantity="updateQuantity"
        />

        <SummarySkeleton v-else />
      </Section>
    </template>

    <template #aside-footer>
      <SummaryFooter
        v-if="product && meta?.isAvailable"
        :product="product"
        @resolve="doResolve"
      />
    </template>
    <template #footer>
      <p
        v-for="(term, index) in tm('product.smallprint')"
        :key="index"
        class="leading-snug"
      >
        {{ term }}
      </p>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { computed, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useRoutingEngine,
  useBasketProductsPending,
  useQueryParams,
  useBrand,
  useProductConfig,
  ROUTE,
  type ProductBreadcrumb
} from "@upmind-automation/headless";
import config from "./product.config";

// --- components
import { Layout, Breadcrumb, useStyles } from "@upmind-automation/upmind-ui";
import Share from "../../components/navigation/Share.vue";
import ConfigSkeleton from "./components/ConfigSkeleton.vue";
import Header from "./components/header/Header.vue";
import HeaderSkeleton from "./components/header/HeaderSkeleton.vue";
import ProductConfig from "./components/config/Config.vue";
import Section from "../../components/content/LayoutSection.vue";
import Summary from "./components/summary/Summary.vue";
import SummaryFooter from "./components/summary/SummaryFooter.vue";
import SummarySkeleton from "./components/summary/SummarySkeleton.vue";
import ProductNotFound from "./NotFound.vue";

// --- utils
import { forEach, isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

const { navigateBack, navigateNext, isResolved } = useRoutingEngine();
const { isReady } = useBasket();
const { productId } = useQueryParams();

const { configure, resolve, remove } = useBasketProductsPending();
const { hasStorefront, storefrontRoute, uiCart } = useBrand();

await isReady();
await isResolved(ROUTE.PRODUCT_ADD);

const { update, service: pendingProduct, onDone } = await configure(productId);

const { meta, product, productImage, updateQuantity } =
  useProductConfig(pendingProduct);

const configMeta = computed(() => {
  return {
    layout: uiCart.value?.layout
  };
});

const styles = useStyles("product", configMeta, config) as ComputedRef<{
  product: {
    summary: string;
  };
}>;

const items = computed(() => {
  // Storefront
  const items: any[] = [
    {
      label: t("product.shop"),
      ...storefrontRoute?.value,
      current: false
    }
  ];

  // Categories
  if (!isEmpty(product?.value?.productDetails?.breadcrumb)) {
    forEach(
      product.value.productDetails.breadcrumb,
      (category: ProductBreadcrumb) => {
        items.push({
          label: category.label,
          to: !hasStorefront.value
            ? { name: ROUTE.CATALOGUE, query: { catid: category.id } }
            : undefined,
          current: uiCart.value?.catalogue?.disabled || hasStorefront.value
        });
      }
    );
  }

  // Current product
  items.push({
    label: product.value?.productDetails?.title,
    current: true
  });

  return items;
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
});
</script>
