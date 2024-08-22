<template>
  <primitive :as-child="asChild" :as="as">
    <slot />
  </primitive>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Primitive } from "radix-vue";
import type { PrimitiveProps } from "radix-vue";
import type { PropType } from "vue";

export default defineComponent({
  name: "UwAvatarFallback",
  components: {
    Primitive,
  },
  props: {
    as: {
      type: String as PropType<PrimitiveProps["as"]>,
      default: "span",
    },
    asChild: {
      type: Boolean as PropType<PrimitiveProps["asChild"]>,
    },
  },
});
</script>
