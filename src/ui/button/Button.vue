<script lang="ts" setup>
import { Primitive, type PrimitiveProps } from "radix-vue";
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

interface Props extends PrimitiveProps {
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  as: "button"
});
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="cn(props.class)"
    data-testid="button"
  >
    <slot />
  </Primitive>
</template>
