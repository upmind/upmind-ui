<template>
  <Carousel
    :key="meta.isActive"
    ref="carousel"
    class="embla relative"
    :opts="{
      active: meta.isActive,
      loop: false,
    }"
  >
    <div v-if="active" class="flex justify-end space-x-2">
      <CarouselPrevious class="!static" />
      <CarouselNext class="!static" />
    </div>

    <CarouselContent
      :class="['embla__container', { 'justify-center': !meta.isActive }]"
      overflow
    >
      <CarouselItem
        v-for="recommendation in props.recommendations"
        :key="recommendation.id"
        class="md:basis-1/2 xl:basis-1/3"
      >
        <RecommendationCard v-bind="recommendation" @resolve="doResolve" />
      </CarouselItem>
    </CarouselContent>
  </Carousel>
</template>

<script lang="ts" setup>
// --- external
import { computed, onMounted, ref, useTemplateRef } from "vue";

// ---internal
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@upmind-automation/upwind";

// --- components
import RecommendationCard from "./RecommendationCard.vue";

//--- utils

// --- types
import type { Recommendation } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    recommendations: Recommendation[];
  }>(),
  {
    recommendations: () => [],
  }
);

const emit = defineEmits<{
  (e: "resolve", id: string): void;
}>();

const carousel = useTemplateRef<HTMLDivElement>("carousel");

const doResolve = (id: string) => {
  emit("resolve", id);
};

const active = ref(false);
const carouselApi = ref();
const carouselRef = ref();

const meta = computed(() => ({
  isActive: active.value,
}));

onMounted(() => {
  carouselRef.value = carousel.value?.carouselRef;
  carouselApi.value = carousel.value?.carouselApi;
  active.value =
    carouselRef.value?.scrollWidth > carouselRef.value?.clientWidth;

  console.log({
    carouselApi: carouselApi.value,
    carouselRef: carouselRef.value,
    active: active.value,
  });
});
</script>
