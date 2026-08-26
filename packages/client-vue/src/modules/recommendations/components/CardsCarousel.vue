<template>
  <CarouselRoot
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
    <div v-if="active" :class="carouselNavigationVariants()">
      <CarouselPrevious :label="t('text.previous_slide')" class="static!" />
      <CarouselNext :label="t('text.next_slide')" class="static!" />
    </div>

    <CarouselContent
      :class="['embla__container', { 'justify-center': !active }, '-ml-12']"
      overflow
    >
      <CarouselItem
        v-for="recommendation in items"
        :key="recommendation.id"
        :class="carouselItemVariants()"
      >
        <ProductCardSkeleton v-if="recommendation.meta?.loading" hide-terms />

        <ProductCard
          v-else
          v-bind="recommendation"
          :data-attrs="{
            'data-test-value': recommendation.configuration.productId
          }"
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
  </CarouselRoot>
</template>

<script lang="ts" setup>
import {
  CarouselRoot,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@upmind/ui";
import { vResizeObserver } from "@vueuse/components";
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  ProductCard,
  ProductCardSkeleton
} from "../../product/components/card";
import { carouselNavigationVariants, carouselItemVariants } from "../variants";
import { forEach, some } from "lodash-es";
import type { RecommendationsProps } from "./types";
import type { CarouselApi } from "@upmind/ui";
import type { Product } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const { t } = useI18n();
const props = withDefaults(defineProps<RecommendationsProps>(), {});

const emit = defineEmits<{
  (e: "resolve", id: string): void;
  (e: "fetch", id: string): void;
}>();

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
// Bind the visible-slides fetch trigger on EVERY (re)mounted embla api — not
// once. The carousel re-inits (its `:key` changes) whenever `active` flips, e.g.
// when the item set grows enough to overflow or the viewport resizes across that
// point. Watching once bound the listener to the first api only, so after a
// re-init the new api had no `slidesInView` handler and cards scrolled into view
// stayed on their loading skeleton (the fetch that clears meta.loading never
// fired). Embla clears the old instance's listeners on destroy, so re-binding
// each time is safe. Do NOT restore the watch-once wiring.
watch(carouselApi, api => {
  if (!api) return;
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
