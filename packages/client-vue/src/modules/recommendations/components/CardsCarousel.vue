<template>
  <Carousel
    v-resize-observer="setActive"
    :key="`recommendations-active-${active}`"
    @init-api="setApi"
    class="embla relative max-w-dvw contain-[inline-size]"
    :opts="{
      loop: false,
      align: 'center',
      dragFree: true,
      watchDrag: active
    }"
  >
    <div v-if="active" :class="styles.recommendation.carousel.navigation">
      <CarouselPrevious class="static!" />
      <CarouselNext class="static!" />
    </div>

    <CarouselContent
      :class="['embla__container', { 'justify-center': !active }, '-ml-12']"
      overflow
    >
      <CarouselItem
        v-for="recommendation in items"
        :key="recommendation.id"
        :class="styles.recommendation.carousel.item"
      >
        <ProductCardSkeleton v-if="recommendation.meta?.loading" hide-terms />

        <ProductCard
          v-else
          v-bind="recommendation"
          :preserve-promotion="preservePromotions"
          :navigate="false"
          :disabled="recommendation.meta.added"
          color="secondary"
          hide-terms
          @resolve="doResolve"
          :configure-route="props.configureRoute"
        />
      </CarouselItem>
    </CarouselContent>
  </Carousel>
</template>

<script lang="ts" setup>
// --- external
import { nextTick, ref, watch, computed } from "vue";
import { vResizeObserver } from "@vueuse/components";

// --- internal
import { parseBillingCycle, UIContext } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../recommendations.config";

// --- components
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@upmind-automation/upmind-ui";

import {
  ProductCard,
  ProductCardSkeleton
} from "../../product/components/card";

//--- utils
import { forEach, some, omit } from "lodash-es";

// --- types
import type { Product } from "@upmind-automation/headless";
import type { CarouselApi } from "@upmind-automation/upmind-ui";
import type { RecommendationsProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RecommendationsProps>(), {});

const emit = defineEmits<{
  (e: "resolve", id: string): void;
  (e: "fetch", id: string): void;
}>();

const styles = useStyles(["recommendation.carousel"], {}, config);

// ---

function doResolve(id: string) {
  emit("resolve", id);
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

const preservePromotions = computed(() =>
  some(props.items, (p: Product) => p.meta?.discounted === true)
);

watch(props, ({ refreshing }) => {
  if (refreshing) fetchVisibleRecommendations();
});
</script>
