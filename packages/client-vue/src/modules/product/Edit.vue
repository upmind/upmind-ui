<template>
  <Layout :variant="configMeta.layout" minimal>
    <template #navigation>
      <Back @click.prevent="doReject" />
    </template>

    <template #header>
      <Header v-if="product && meta?.isAvailable" v-bind="product" />
      <HeaderSkeleton v-else />
    </template>

    <template #default>
      <Section :title="t('product.configure')">
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
import { computed, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useRoutingEngine,
  useBasketProducts,
  useQueryParams,
  useBrand,
  useProductConfig,
  ROUTE
} from "@upmind-automation/headless";
import config from "./product.config";

// --- components
import { Layout, useStyles } from "@upmind-automation/upmind-ui";
import Back from "../../components/navigation/Back.vue";
import ConfigSkeleton from "./components/ConfigSkeleton.vue";
import Header from "./components/header/Header.vue";
import HeaderSkeleton from "./components/header/HeaderSkeleton.vue";
import ProductConfig from "./components/config/Config.vue";
import Section from "../../components/content/LayoutSection.vue";
import Summary from "./components/summary/Summary.vue";
import SummaryFooter from "./components/summary/SummaryFooter.vue";
import SummarySkeleton from "./components/summary/SummarySkeleton.vue";
import ProductNotFound from "./NotFound.vue";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

const { navigateBack, navigateNext, isResolved } = useRoutingEngine();
const { isReady } = useBasket();
const { basketProductId } = useQueryParams();
const { configure } = useBasketProducts();
const { uiCart } = useBrand();

await isReady();
await isResolved(ROUTE.PRODUCT_EDIT);

const {
  stop,
  update,
  service: basketProduct
} = await configure(basketProductId);

const { meta, product, updateQuantity } = useProductConfig(basketProduct);

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

async function doResolve() {
  update()
    .then(() => navigateNext(basketProduct))
    .catch(() => {
      // if we take more than 60 seconds to resolve the product ( which is unlikely but possible),
      // add a failsafe to ensure the user is not stuck on the page and that we actually navigate away,
      // if the product is successfully added to the basket ( onDone = success)
      watch(
        meta,
        ({ isDone }) => {
          if (isDone) navigateNext(basketProduct);
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
  stop();
});
</script>
