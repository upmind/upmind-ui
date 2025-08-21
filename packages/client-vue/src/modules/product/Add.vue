<template>
  <Layout :variant="uiCart?.layout" minimal>
    <template #controls>
      <Breadcrumb :items="items" size="lg" />
    </template>

    <template #actions>
      <Share class="hidden md:flex" />
    </template>

    <template #header>
      <Header v-bind="product" :product-image="productImage()" />
    </template>

    <template #default>
      <Section :title="t('product.configure')">
        <form @submit.prevent @reset.prevent>
          <ProductConfig
            v-if="pendingProduct && !meta?.isLoading"
            :item="pendingProduct"
            :model-value="pendingProduct?.id"
            :no-footer="true"
            as="div"
            @resolve="doResolve"
            @reject="doReject"
          />
          <ConfigSkeleton v-else />
        </form>
      </Section>
    </template>

    <template #aside>
      <Section
        :title="t('product.summary.title')"
        :class="styles.product.summary"
      >
        <Summary
          v-if="pendingProduct"
          :item="pendingProduct"
          @resolve="doResolve"
        />
      </Section>
    </template>

    <template #aside-footer>
      <SummaryFooter
        v-if="pendingProduct"
        :item="pendingProduct"
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
import { watch, computed, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { forEach } from "lodash-es";

// --- internal
import {
  useBasket,
  useRoutingEngine,
  useBasketProductsPending,
  useQueryParams,
  useBrand,
  useProductConfig,
  useProductCategories,
  ROUTE
} from "@upmind-automation/headless";
import config from "./product.config";

// --- components
import { Layout, Breadcrumb, useStyles } from "@upmind-automation/upmind-ui";
import ProductConfig from "./components/config/Config.vue";
import Summary from "./components/summary/Summary.vue";
import SummaryFooter from "./components/summary/SummaryFooter.vue";
import ConfigSkeleton from "./components/ConfigSkeleton.vue";
import Share from "../../components/navigation/Share.vue";
import Header from "./components/header/Header.vue";
import Section from "../../components/content/LayoutSection.vue";

// --- types
import type { ProductCategory } from "@upmind-automation/headless";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

const { navigateBack, navigateNext, isResolved } = useRoutingEngine();
const { isReady } = useBasket();
const { productId } = useQueryParams();
const { configure, resolve, remove } = useBasketProductsPending();
const { hasStorefront, storefrontUrl, uiCart } = useBrand();
const { getPath } = useProductCategories();

await isReady();
await isResolved(ROUTE.PRODUCT_ADD);

const {
  meta,
  stop,
  update,
  service: pendingProduct
} = await configure(productId);

const { product, productImage } = useProductConfig(pendingProduct);

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
      to: !hasStorefront.value ? { name: ROUTE.CATALOGUE } : undefined,
      href: hasStorefront.value ? storefrontUrl.value : undefined,
      current: false
    }
  ];

  // Categories
  if (product?.value?.productDetails?.categoryId) {
    const categoryPath = getPath(product.value.productDetails.categoryId);
    forEach(categoryPath, (category: ProductCategory) => {
      items.push({
        label: category.title,
        to: !hasStorefront.value
          ? {
              name: ROUTE.CATALOGUE,
              query: {
                catid: category.id
              }
            }
          : undefined,
        current: uiCart.value?.catalogue?.disabled || hasStorefront.value
      });
    });
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
    .catch(() => {
      // if we take more than 60 seconds to resolve the product ( which is unlikely but possible),
      // add a failsafe to ensure the user is not stuck on the page and that we actually navigate away,
      // if the product is successfully added to the basket ( onDone = success)
      watch(
        meta,
        ({ isDone }) => {
          if (isDone) {
            resolve(pendingProduct);
            navigateNext(pendingProduct);
          }
        },
        {
          immediate: true
        }
      );
    });
}

function doReject() {
  navigateBack();
}

onUnmounted(() => {
  remove(productId);
});
</script>
