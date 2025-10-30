<template>
  <Layout :variant="layout" minimal>
    <template #navigation>
      <Back @click.prevent="doReject" />
    </template>

    <template #content-header>
      <ProductHero
        v-if="meta?.isAvailable && product?.productDetails"
        :product-details="product.productDetails"
        :product-image="productImage()"
      />
      <ProductHeroSkeleton v-else />
    </template>

    <template #default>
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

          <ProductNotFound v-else-if="meta?.isUnavailable" />

          <ConfigSkeleton v-else />
        </form>
      </Section>
    </template>

    <template #aside>
      <Section
        :label="t('text.summary')"
        icon="shopping-bag-02"
        :class="styles.product.summary"
      >
        <Summary
          v-if="product && meta?.isAvailable"
          :product="product"
          :meta="meta"
          edit
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
  useBasketProducts,
  useQueryParams,
  useProductConfig,
  ROUTE
} from "@upmind-automation/headless";
import config from "./product.config";

// --- components
import { useStyles } from "@upmind-automation/upmind-ui";
import Layout from "../../components/layout/Layout.vue";
import Back from "../../components/navigation/Back.vue";
import ConfigSkeleton from "./components/ConfigSkeleton.vue";
import ProductHero from "./components/hero/ProductHero.vue";
import ProductHeroSkeleton from "./components/hero/ProductHeroSkeleton.vue";
import ProductConfig from "./components/config/Config.vue";
import Section from "../../components/section/Section.vue";
import Summary from "./components/summary/Summary.vue";
import SummaryFooter from "./components/summary/SummaryFooter.vue";
import SummarySkeleton from "./components/summary/SummarySkeleton.vue";
import ProductNotFound from "./NotFound.vue";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const { t, tm } = useI18n();

const { navigateBack, navigateNext, isResolved, currentRoute } =
  useRoutingEngine();
const { isReady } = useBasket();
const { basketProductId } = useQueryParams();
const { configure } = useBasketProducts();

await isReady();
await isResolved(ROUTE.PRODUCT_EDIT);

const {
  stop,
  update,
  service: basketProduct,
  onDone
} = await configure(basketProductId);

const { meta, product, updateQuantity, productImage } =
  useProductConfig(basketProduct);

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
});

const styles = useStyles("product", { layout }, config) as ComputedRef<{
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
});
</script>
