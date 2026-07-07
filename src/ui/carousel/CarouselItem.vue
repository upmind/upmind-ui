<script setup lang="ts">
import { useCarousel } from "./useCarousel";
import { cn, useTestAttrs } from "../../utils";
import type { WithClassAsProps } from "./types";

const props = defineProps<WithClassAsProps>();

const testAttrs = useTestAttrs({
  key: "carousel-card"
});

const { orientation } = useCarousel();
</script>

<template>
  <div
    role="group"
    aria-roledescription="slide"
    :class="
      cn(
        'min-w-0 shrink-0 grow-0 basis-full',
        orientation === 'horizontal' ? 'pl-4' : 'pt-4',
        props.class
      )
    "
    v-bind="testAttrs"
  >
    <slot />
  </div>
</template>
