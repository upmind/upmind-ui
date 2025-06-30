<template>
  <aside v-auto-animate>
    <div class="flex flex-col items-center justify-center p-2">
      <SmartTitle
        i18n-key="recommendations.header.title"
        size="3xl"
        align="center"
      />

      <p
        class="text-emphasis-medium m-0 mb-12 mt-4 max-w-md text-center text-lg leading-normal"
      >
        {{ t("recommendations.header.subtitle") }}
      </p>
    </div>

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

    <Card
      class="md:bg-base mt-8 flex flex-col items-center justify-between bg-transparent !p-0 shadow-none md:mt-8 md:flex-row md:!px-8 md:!py-6 md:shadow-sm"
    >
      <div
        class="text-md order-last mt-4 text-center font-medium md:order-first md:mt-0 md:text-left"
      >
        {{ t("recommendations.toolbar.title", { count: products?.length }) }}
      </div>

      <Button
        @click="doClose"
        :label="t('recommendations.toolbar.actions.continue')"
        color="secondary"
        class="w-full md:w-auto"
      >
        <template #append>
          <Icon icon="arrow-right" size="2xs" />
        </template>
      </Button>
    </Card>
  </aside>
</template>

<script lang="ts" setup>
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useRecommendations,
  useRoutingEngine,
  ROUTE
} from "@upmind-automation/headless";

// --- components
import { Button, Icon } from "@upmind-automation/upmind-ui";
import Configure from "./components/Configure.vue";
import CardsCarousel from "./components/CardsCarousel.vue";
import Card from "../../components/content/Card.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();

// --- basket setup
const { navigateNext, isResolved } = useRoutingEngine();

await isResolved(ROUTE.RECOMMENDATIONS);

const { products } = useBasket();
const {
  seen,
  isReady,
  basketItem,
  meta,
  recommendations,
  add,
  fetchRecommendation
} = useRecommendations();

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
