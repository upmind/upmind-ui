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
  <Primitive :as-child="asChild" :as="as">
    <slot />
  </Primitive>
</template>
