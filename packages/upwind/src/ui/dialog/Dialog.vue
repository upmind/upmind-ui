<template>
  <dialog-root @update:open="$emit('update:open', $event)">
    <slot />
  </dialog-root>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { DialogRoot } from "radix-vue";

export default defineComponent({
  components: {
    DialogRoot,
  },
  emits: ["update:open"],
});
</script>
