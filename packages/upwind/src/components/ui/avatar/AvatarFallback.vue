<script lang="ts">
import type { PrimitiveProps } from "radix-vue";
export interface AvatarFallbackProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from "radix-vue";
const props = withDefaults(defineProps<AvatarFallbackProps>(), {
  as: "span",
});
</script>

<template>
  <primitive :as-child="asChild" :as="as">
    <slot />
  </primitive>
</template>
