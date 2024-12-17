<template>
  <Carousel
    class="embla relative w-full"
    :opts="{
      align: 'start',
      active: carouselActive,
    }"
  >
    <div v-if="carouselActive" class="flex justify-end space-x-2">
      <CarouselPrevious class="!static" />
      <CarouselNext class="!static" />
    </div>
    <CarouselContent class="embla__container" overflow>
      <CarouselItem
        v-for="(recommendation, index) in recommendations"
        :key="index"
        :class="getItemClass"
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

const isMobile = useMediaQuery("(max-width: 768px)");
const isTablet = useMediaQuery("(max-width: 1024px)");

const carouselRequiredWidth = computed(() =>
  props.recommendations.length === 2 ? isMobile.value : isTablet.value
);

const carouselActive = computed(
  () =>
    props.recommendations.length > 3 ||
    (carouselRequiredWidth.value && props.recommendations.length > 1)
);

const getItemClass = computed(() => {
  const count = props.recommendations.length;
  if (count === 1) return "w-full";
  if (count === 2) return "md:basis-1/2";
  return "md:basis-1/2 xl:basis-1/3";
});
</script>
