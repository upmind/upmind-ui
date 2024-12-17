<template>
  <Carousel
    class="embla relative w-full"
    :opts="{
      align: 'start',
    }"
  >
    <div class="mb-6 flex justify-end space-x-2">
      <CarouselPrevious class="!static" />
      <CarouselNext class="!static" />
    </div>
    <CarouselContent class="embla__container" overflow>
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

const doResolve = (id: string) => {
  emit("resolve", id);
};
</script>
