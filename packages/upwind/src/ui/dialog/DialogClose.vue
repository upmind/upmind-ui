<template>
  <dialog-close :as-child="asChild">
    <slot />
  </dialog-close>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { DialogClose } from "radix-vue";

export default defineComponent({
  components: {
    DialogClose,
  },
  props: {
    asChild: Boolean,
  },
});
</script>
