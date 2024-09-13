<template>
  <div class="mt-auto flex flex-col gap-2 p-4">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    class: String,
  },
  setup() {
    return {};
  },
});
</script>
