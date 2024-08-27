<template>
  <PopoverTrigger>
    <slot />
  </PopoverTrigger>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { PopoverTrigger } from "radix-vue";

export default defineComponent({
  components: {
    PopoverTrigger,
  },
  props: {
    asChild: Boolean,
  },
});
</script>
