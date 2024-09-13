<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      v-bind="$attrs"
      :class="'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background'"
    >
      <div class="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { DrawerContent, DrawerPortal } from "vaul-vue";
import DrawerOverlay from "./DrawerOverlay.vue";

export default defineComponent({
  components: {
    DrawerContent,
    DrawerPortal,
    DrawerOverlay,
  },
  props: {
    open: { type: Boolean, required: true },
    defaultOpen: { type: Boolean },
    modal: { type: Boolean },
    dir: { type: String },
    forceMount: { type: Boolean },
  },
  emits: ["update:open"],
});
</script>
