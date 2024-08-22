<template>
  <dialog-trigger>
    <slot />
  </dialog-trigger>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { DialogTrigger } from "radix-vue";

export default defineComponent({
  components: {
    DialogTrigger,
  },
});
</script>
