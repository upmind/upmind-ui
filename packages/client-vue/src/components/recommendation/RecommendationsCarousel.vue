<template>
  <Carousel
    v-if="
      recommendations.length > 3 || (showCarousel && recommendations.length > 1)
    "
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
        v-for="(recommendation, index) in recommendations"
        :key="index"
        class="md:basis-1/2 xl:basis-1/3"
      >
        <RecommendationCard
          :index="index"
          :recommendation="recommendation"
          :meta="meta"
          @resolve="doResolve"
        />
      </CarouselItem>
    </CarouselContent>
  </Carousel>
  <div v-else class="mt-8 flex justify-center gap-6">
    <RecommendationCard
      v-for="(recommendation, index) in recommendations"
      :key="index"
      :index="index"
      :recommendation="recommendation"
      :meta="meta"
      @resolve="doResolve"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@upmind-automation/upwind";
import RecommendationCard from "./RecommendationCard.vue";
import { useMediaQuery } from "@vueuse/core";

const props = defineProps<{
  recommendations: any[];
  meta: any;
}>();

const emit = defineEmits<{
  (e: "resolve", id: string): void;
}>();

const doResolve = (id: string) => {
  emit("resolve", id);
};

const showCarousel = computed(() => {
  return props.recommendations.length === 2
    ? useMediaQuery("(max-width: 768px)").value
    : useMediaQuery("(max-width: 1024px)").value;
});
</script>
