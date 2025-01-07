<template>
  <Carousel
    :key="`recommendations-active-${active}`"
    @init-api="setApi"
    class="embla relative"
    :opts="{
      active: active,
      loop: false,
    }"
  >
    <div v-if="active" class="flex justify-end space-x-2">
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
        class="md:basis-1/2 xl:basis-1/3"
        v-auto-animate
      >
        <RecommendationCardSkeleton v-if="recommendation.meta?.loading" />
        <RecommendationCard
          v-else
          v-bind="recommendation"
          @resolve="doResolve"
          :disabled="meta.isProcessing"
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
    class-footer="flex-row items-center justify-between gap-x-4"
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
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useBasket,
  useRecommendationsEngine,
  UpmProductConfig,
} from "@upmind-automation/client-vue";

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

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {}
);

const emit = defineEmits<{
  (e: "resolve", ids: string[]): void;
}>();

const { t } = useI18n();

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

// Now add a watcher that lets the parent know any/all carousel items that are visible/active
// This will be used to trigger fetching the next batch of recommendations
const stop = watch(carouselApi, api => {
  if (!api) return;

  // Watch only once or use watchOnce() in @vueuse/core
  nextTick(() => stop());

  // --- now set up our carousel api listeners
  const container = api?.containerNode();
  active.value = (container?.scrollWidth ?? 0) > (container?.clientWidth ?? 0);

  api.on("slidesInView", () => {
    const visible = api?.slidesInView();

    // now fetch the next batch of recommendations, one by one
    forEach(recommendations.value, (recommendation, index) => {
      if (visible.includes(index)) {
        fetchRecommendation(recommendation.id);
      }
    });
  });
});
</script>
