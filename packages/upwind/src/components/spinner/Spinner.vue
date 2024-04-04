<template>
  <div
    class="inline-block animate-spin rounded-full border-[0.2em] border-current border-t-transparent text-current"
    role="status"
    aria-label="loading"
  >
    <span class="sr-only">Loading...</span>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "UpwSpinner",
});
</script>
