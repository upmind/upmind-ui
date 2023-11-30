<template>
  <span
    v-if="!!percentage"
    path="save_x_percent"
    class="bg-primary/10 text-primary border-primary text-tiny shrink-0 rounded-md border px-1.5 py-0.5 text-center font-medium uppercase"
  >
    Save ${{ percentage }}%
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "UpmDacResultsDropdown",
  props: {
    percentage: {
      type: Number,
      default: 0
    }
  }
});
</script>
