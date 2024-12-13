<script setup lang="ts">
import type { WithClassAsProps } from "./interface";
import { cn } from "../../utils";
import { useCarousel } from "./useCarousel";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<
  WithClassAsProps & {
    overflow?: boolean;
  }
>();

const { carouselRef, orientation } = useCarousel();

// **** BREAKING CHANGE ****
// Updating this component will remove the overflow prop
</script>

<template>
  <div ref="carouselRef" :class="!overflow ? 'overflow-hidden' : ''">
    <div
      :class="
        cn(
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          props.class
        )
      "
      v-bind="$attrs"
    >
      <slot />
    </div>
  </div>
</template>
