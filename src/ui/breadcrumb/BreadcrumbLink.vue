<script lang="ts" setup>
import { Primitive } from "radix-vue";
import { cn } from "../../utils";
import type { PrimitiveProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

const props = withDefaults(
  defineProps<PrimitiveProps & { class?: HTMLAttributes["class"] }>(),
  {
    as: "a"
  }
);
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn('transition-colors hover:text-base', props.class)"
  >
    <slot />
  </Primitive>
</template>
