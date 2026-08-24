<template>
  <div
    :class="
      cn(
        containerVariants({
          flow: props.flow,
          items: props.items,
          justify: props.justify,
          reverse: props.reverse
        }),
        props.class
      )
    "
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { cn } from "@upmind/ui";
import { containerVariants } from "./variants";
import type { ContainerProps } from "./types";

const props = withDefaults(defineProps<ContainerProps>(), {
  flow: "none",
  items: "none",
  justify: "none",
  reverse: false
});
</script>
