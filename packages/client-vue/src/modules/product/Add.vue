<template>
  <Layout :variant="layout" minimal>
    <template
      v-if="configMeta.headerBreadcrumbs && meta?.isAvailable"
      #navigation
    >
      <Breadcrumb :items="items" size="lg" />
    </template>

    <template v-if="configMeta.headerBreadcrumbs && meta?.isAvailable" #actions>
      <Share class="hidden md:flex" />
    </template>

    <template #content-header>
      <Header
        v-if="meta?.isAvailable && product?.productDetails"
        :product-details="product.productDetails"
        :product-image="productImage()"
      />
      <HeaderSkeleton v-else />
    </template>

    <template #content>
      <Section
        :title="meta?.isAvailable ? t('text.product_configuration') : ''"
      >
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

        <template v-if="!configMeta.headerBreadcrumbs" #action>
          <Share class="hidden md:flex" />
        </template>
      </Section>
    </template>

    <template #aside>
      <Section :title="t('text.summary')" :class="styles.product.summary" aside>
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
        v-for="(term, index) in tm('text.product_smallprint')"
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
import { Breadcrumb, useStyles, Layout } from "@upmind-automation/upmind-ui";
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
import { forEach, isEmpty, last, compact, first } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import { BreadcrumbVariant } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

const { navigateBack, navigateNext, isResolved, currentRoute } =
  useRoutingEngine();
const { isReady } = useBasket();
const { productId } = useQueryParams();

const { configure, resolve, remove } = useBasketProductsPending();
const { hasStorefront, storefrontRoute, uiCart } = useBrand();

await isReady();
await isResolved(ROUTE.PRODUCT_ADD);

const { update, service: pendingProduct, onDone } = await configure(productId);

const { meta, product, productImage, updateQuantity } =
  useProductConfig(pendingProduct);

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
});

const configMeta = computed(() => {
  const breadcrumbs =
    product.value?.productDetails?.uiMeta?.uischema?.config?.breadcrumbs;
  return {
    layout: layout.value,
    breadcrumbs,
    headerBreadcrumbs: breadcrumbs !== BreadcrumbVariant.HIDDEN && breadcrumbs
  };
});

const styles = useStyles("product", configMeta, config) as ComputedRef<{
  product: {
    summary: string;
  };
}>;

const items = computed(() => {
  const variant = configMeta.value?.breadcrumbs;
  const items: any[] = [];

  if (!product.value?.productDetails || variant === BreadcrumbVariant.HIDDEN) {
    return items;
  }

  // Storefront (for visible and condensed)
  if (variant !== BreadcrumbVariant.CATEGORY) {
    items.push({
      label: t("text.shop"),
      ...storefrontRoute?.value,
      current: false
    });
  }

  // For condensed, show ellipsis for middle items
  if (
    variant === BreadcrumbVariant.CONDENSED &&
    !isEmpty(product.value.productDetails.breadcrumb)
  ) {
    items.push({
      label: "..."
    });
  }

  // Categories
  if (variant !== BreadcrumbVariant.CONDENSED) {
    const categories = compact(
      variant === BreadcrumbVariant.CATEGORY
        ? [last(product.value.productDetails.breadcrumb)]
        : product.value.productDetails.breadcrumb
    );

    forEach(categories, (category: ProductBreadcrumb) => {
      items.push({
        label: category.label,
        to: !hasStorefront.value
          ? { name: ROUTE.CATALOGUE, query: { catid: category.id } }
          : undefined,
        current: uiCart.value?.catalogue?.disabled || hasStorefront.value
      });
    });
  }

  // Last item: current product (visible) or last category (condensed)
  if (variant === BreadcrumbVariant.VISIBLE) {
    items.push({
      label: product.value.productDetails.title,
      current: true
    });
  } else if (variant === BreadcrumbVariant.CONDENSED) {
    const category = first(product.value.productDetails.breadcrumb);
    if (category) {
      items.push({
        label: category.label,
        to: !hasStorefront.value
          ? { name: ROUTE.CATALOGUE, query: { catid: category.id } }
          : undefined
      });
    }
  }

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
