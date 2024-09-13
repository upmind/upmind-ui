<template>
  <div class="grid gap-1.5 p-4 text-center sm:text-left">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    class: { type: [String, Object, Array] },
  },
  setup() {
    return {};
  },
});
</script>
