<template>
  <Layout :variant="uiCart?.layout" minimal>
    <template #navigation>
      <Back @click.prevent="doReject" />
    </template>

    <template #header>
      <Header v-if="product" v-bind="product" />
    </template>

    <template #default>
      <Section :title="t('product.configure')">
        <form @submit.prevent @reset.prevent>
          <ProductConfig
            v-if="basketProduct && !meta?.isLoading"
            :item="basketProduct"
            :model-value="basketProduct?.id"
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
          v-if="basketProduct && !meta?.isLoading"
          :item="basketProduct"
          @resolve="doResolve"
        />
      </Section>
    </template>

    <template #aside-footer>
      <SummaryFooter
        v-if="basketProduct && !meta?.isLoading"
        :item="basketProduct"
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
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useRoutingEngine,
  useBasketProducts,
  useQueryParams,
  ROUTE,
  useBrand,
  useProductConfig
} from "@upmind-automation/headless";
import config from "./product.config";

// --- components
import { Layout, useStyles } from "@upmind-automation/upmind-ui";
import ProductConfig from "./components/config/Config.vue";
import Summary from "./components/summary/Summary.vue";
import ConfigSkeleton from "./components/ConfigSkeleton.vue";
import Back from "../../components/navigation/Back.vue";
import Header from "./components/header/Header.vue";
import SummaryFooter from "./components/summary/SummaryFooter.vue";
import Section from "../../components/content/LayoutSection.vue";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

const { navigateBack, navigateNext, isResolved } = useRoutingEngine();
const { isReady } = useBasket();
const { basketProductId } = useQueryParams();
const { configure } = useBasketProducts();
const { uiCart } = useBrand();
const {
  isReady: isReadyBasket,
  meta,
  stop,
  update,
  service: basketProduct
} = await configure(basketProductId);
const { product } = useProductConfig(basketProduct);

await isReady();
await isReadyBasket();
await isResolved(ROUTE.PRODUCT_EDIT);

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
  stop();
  navigateBack();
}
</script>
