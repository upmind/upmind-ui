<template>
  <Layout overflow="hidden">
    <template #header>
      <Header
        :title="t('text.complete_online_toolkit_md')"
        :description="t('text.popular_offers')"
      />
    </template>

    <template #default>
      <Interstitial
        v-if="!meta.hasRecommendations"
        open
        modal
        :title="t('cart.recommendations_unavailable_title_md')"
        :text="t('cart.recommendations_unavailable_text')"
        :actions="[
          {
            handler: navigateNext,
            variant: 'solid',
            color: 'primary',
            iconAppend: 'arrow-right',
            label: t('action.continue_label')
          }
        ]"
      >
      </Interstitial>

      <template v-else>
        <CardsCarousel
          :loading="meta?.isLoading"
          :processing="meta?.isProcessing"
          :refreshing="meta?.isRefreshing"
          :items="recommendations"
          @resolve="doAdd"
          @fetch="fetchRecommendation"
        />

        <Configure
          v-if="basketItem?.id"
          :modelValue="basketItem"
          @resolve="doClose"
        />

        <section
          class="md:bg-control-surface md:border-surface control-radius mt-8 flex flex-col items-center justify-between bg-transparent p-0 md:mt-8 md:flex-row md:border md:px-8 md:py-6"
        >
          <div
            class="text-md order-last mt-4 text-center font-medium md:order-first md:mt-0 md:text-left"
          >
            {{ t("cart.basket_items", { count: products?.length }) }}
          </div>

          <Button
            @click="doClose"
            :label="t('action.continue_label')"
            color="primary"
            size="lg"
            class="w-full md:w-auto"
            iconAppend="arrow-right"
            pill
          />
        </section>
      </template>
    </template>
  </Layout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useProductRecommendations,
  useQueryParams,
  useRoutingEngine,
  ROUTE
} from "@upmind-automation/headless";

// --- components
import { Button, Layout, Interstitial } from "@upmind-automation/upmind-ui";
import Configure from "../recommendations/components/Configure.vue";
import CardsCarousel from "../recommendations/components/CardsCarousel.vue";
import Header from "../../components/content/Header.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();

// --- basket setup
const { navigateNext, isResolved } = useRoutingEngine();
const { productId } = useQueryParams();

await isResolved(ROUTE.PRODUCT_RECOMMENDATIONS);

const { products } = useBasket();
const {
  seen,
  isReady,
  basketItem,
  meta,
  recommendations,
  add,
  fetchRecommendation
} = useProductRecommendations(productId);

await isReady();

// ---

function doAdd(value: string) {
  add(value).then(() => doClose());
}
function doClose() {
  seen();
  navigateNext();
}
</script>
