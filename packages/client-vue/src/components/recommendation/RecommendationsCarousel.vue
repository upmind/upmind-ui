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
</template>

<script lang="ts" setup>
import {
  useCarousel,
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@upmind-automation/upwind";
import RecommendationCard from "./RecommendationCard.vue";

defineProps<{
  recommendations: any[];
  meta: any;
}>();

const emit = defineEmits<{
  (e: "resolve", id: string): void;
}>();

const doResolve = (id: string) => {
  emit("resolve", id);
};

// // Grab wrapper nodes
// const rootNode = document.querySelector(".embla");
// const viewportNode = rootNode?.querySelector(".embla__viewport");

// // Grab button nodes
// const prevButtonNode = rootNode?.querySelector(".embla__prev");
// const nextButtonNode = rootNode?.querySelector(".embla__next");

// const embla = useCarousel(viewportNode);

// prevButtonNode?.addEventListener("click", embla.scrollPrev, false);
// nextButtonNode?.addEventListener("click", embla.scrollNext, false);
</script>
