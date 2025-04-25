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
        v-for="recommendation in items"
        :key="recommendation.id"
        :class="styles.recommendation.carousel.item"
      >
        <RecommendationCardSkeleton v-if="recommendation.meta?.loading" />

        <RecommendationCard
          v-else
          v-bind="recommendation"
          @resolve="doResolve"
          :disabled="processing"
          class="animate-fade"
        />
      </CarouselItem>
    </CarouselContent>
  </Carousel>
</template>

<script lang="ts" setup>
// --- external
import { nextTick, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../recommendations.config";

// --- components
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Button,
} from "@upmind-automation/upmind-ui";

import RecommendationCard from "./Card.vue";
import RecommendationCardSkeleton from "./CardSkeleton.vue";

//--- utils
import { forEach } from "lodash-es";

// --- types
import type { CarouselApi } from "@upmind-automation/upmind-ui";
import type { ComputedRef } from "vue";
import type { RecommendationsProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RecommendationsProps>(), {});

const emit = defineEmits<{
  (e: "resolve", id: string): void;
  (e: "fetch", id: string): void;
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

// ---

function doResolve(value: string) {
  emit("resolve", value);
}

const active = ref(false);
const carouselApi = ref<CarouselApi>();

function setApi(api: CarouselApi) {
  carouselApi.value = api;
}

function fetchVisibleRecommendations() {
  const visible = carouselApi.value?.slidesInView() ?? [];
  if (!visible.length) return;

  // now fetch the next batch of recommendations, one by one
  forEach(props.items, (recommendation, index) => {
    if (visible.includes(index)) {
      emit("fetch", recommendation.id);
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

watch(props, ({ refreshing }) => {
  if (refreshing) fetchVisibleRecommendations();
});
</script>
