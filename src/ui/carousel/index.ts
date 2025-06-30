export { default as Carousel } from "./Carousel.vue";
export { default as CarouselContent } from "./CarouselContent.vue";
export { default as CarouselItem } from "./CarouselItem.vue";
export { default as CarouselNext } from "./CarouselNext.vue";
export { default as CarouselPrevious } from "./CarouselPrevious.vue";
export type { UnwrapRefCarouselApi as CarouselApi } from "./interface";

export type {
  EmblaPluginType,
  EmblaCarouselType,
  EmblaEventListType,
  EmblaEventType,
  EmblaOptionsType,
  EmblaPluginsType
} from "embla-carousel"; // NB: needed for d.ts build

export { useCarousel } from "./useCarousel";
