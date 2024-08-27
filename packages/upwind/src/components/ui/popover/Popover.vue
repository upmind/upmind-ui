<template>
  <PopoverRoot
    :defaultOpen="defaultOpen"
    :open="open"
    :modal="modal"
    @update:open="$emit('update:open', $event)"
  >
    <slot />
  </PopoverRoot>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { PopoverRoot } from "radix-vue";

export default defineComponent({
  components: {
    PopoverRoot,
  },
  props: {
    defaultOpen: { type: Boolean },
    open: { type: Boolean },
    modal: { type: Boolean },
  },
  emits: ["update:open"],
});
</script>
