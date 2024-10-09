<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { Primitive, type PrimitiveProps } from "radix-vue";
import { cn } from "../../utils";

interface Props extends PrimitiveProps {
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
});
</script>

<template>
  <Primitive :as="as" :as-child="asChild" :class="cn(props.class)">
    <slot />
  </Primitive>
</template>
