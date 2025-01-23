<template>
  <Carousel
    :key="`recommendations-active-${active}`"
    @init-api="setApi"
    class="embla relative"
    :opts="{
      loop: false,
      align: 'center',
      dragFree: true,
    }"
  >
    <div v-if="active" :class="styles.recommendation.carousel.navigation">
      <CarouselPrevious class="!static" />
      <CarouselNext class="!static" />
    </div>

    <CarouselContent
      :class="['embla__container', { 'justify-center': !active }]"
      overflow
    >
      <CarouselItem
        v-for="recommendation in recommendations"
        :key="recommendation.id"
        :class="styles.recommendation.carousel.item"
      >
        <RecommendationCardSkeleton
          v-if="recommendation.meta?.loading || true"
        />
        <RecommendationCard
          v-else
          v-bind="recommendation"
          @resolve="doResolve"
          :disabled="meta.isProcessing"
          class="animate-fade"
        />
      </CarouselItem>
    </CarouselContent>
  </Carousel>

  <Drawer
    v-if="basketItem"
    to="#vue-app"
    fit="cover"
    skrim="primary"
    :open="meta.isConfiguring"
    :title="t('recommendations.configuration.title')"
    :description="t('recommendations.configuration.description')"
    :dismissible="false"
    :class-footer="styles.recommendation.carousel.footer"
  >
    <UpmProductConfig
      :item="basketItem"
      :processing="meta?.isProcessing"
      :model-value="basketItem.id"
      :no-footer="true"
      @resolve="doUpdate(basketItem.id)"
      @reject="doCancel(basketItem.id)"
    />

    <template #close>
      <Button
        @click="doCancel(basketItem.id)"
        :label="t('recommendations.configuration.actions.reject')"
        variant="link"
        color="primary"
      />
    </template>

    <template #actions>
      <Button
        :loading="meta.isProcessing"
        :disabled="props.disabled || meta.isProcessing"
        @click="doUpdate(basketItem.id)"
        :label="t('recommendations.configuration.actions.resolve')"
        prependIcon="plus-circle"
        color="primary"
      />
    </template>
  </Drawer>
</template>

<script lang="ts" setup>
// --- external
import { nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upwind";
import config from "./config.cva";
import {
  useBasket,
  useRecommendationsEngine,
} from "@upmind-automation/headless-vue";
import UpmProductConfig from "../product/Config.vue";

// --- components
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Drawer,
  Button,
} from "@upmind-automation/upwind";

import RecommendationCard from "./RecommendationCard.vue";
import RecommendationCardSkeleton from "./RecommendationCardSkeleton.vue";

//--- utils
import { forEach } from "lodash-es";

// --- types
import type { CarouselApi } from "@upmind-automation/upwind";
import type { ComputedRef } from "vue";
import type { RecommendationsProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RecommendationsProps>(), {});

const emit = defineEmits<{
  (e: "resolve", ids: string[]): void;
}>();

const { t } = useI18n();

const styles = useStyles(
  ["recommendation.carousel"],
  {},
  config
) as ComputedRef<{
  recommendation: {
    carousel: {
      navigation: string;
      item: string;
      footer: string;
    };
  };
}>;

// --- basket setup
const { meta, recommendations, add, basketItem, cancel, fetchRecommendation } =
  useRecommendationsEngine();

const { updateItem, removeItem } = useBasket();

// ---

function doResolve(value: string) {
  add(value).then(() => emit("resolve", [value]));
}

function doUpdate(id: string) {
  updateItem(id).then(() => emit("resolve", [id]));
}

function doCancel(id: string) {
  removeItem(id).then(cancel);
}

const active = ref(false);
const carouselApi = ref<CarouselApi>();

function setApi(api: CarouselApi) {
  carouselApi.value = api;
}

function fetchVisibleRecommendations() {
  const visible = carouselApi.value?.slidesInView() ?? [];
  if (!visible.length) return;

  // console.log("Carousel", "visible", visible);
  // now fetch the next batch of recommendations, one by one
  forEach(recommendations.value, (recommendation, index) => {
    if (visible.includes(index)) {
      fetchRecommendation(recommendation.id);
    }
  });
}

function setActive() {
  active.value =
    (carouselApi.value?.containerNode()?.scrollWidth ?? 0) >
    (carouselApi.value?.containerNode()?.clientWidth ?? 0);
}
// Now add a watcher that lets the parent know any/all carousel items that are visible/active
// This will be used to trigger fetching the next batch of recommendations
const stop = watch(carouselApi, api => {
  if (!api) return;

  // Watch only once or use watchOnce() in @vueuse/core
  nextTick(() => stop());

  // --- now set up our carousel api listeners
  setActive();
  api.on("slidesInView", fetchVisibleRecommendations);
});

watch(meta, ({ isRefreshing }) => {
  if (isRefreshing) fetchVisibleRecommendations();
});
</script>
