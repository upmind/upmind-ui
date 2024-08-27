<template>
  <DrawerRoot v-bind="$attrs">
    <slot />
  </DrawerRoot>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { DrawerRoot } from "vaul-vue";

export default defineComponent({
  components: {
    DrawerRoot,
  },
  props: {
    shouldScaleBackground: { type: Boolean, default: true },
    direction: { type: String },
    open: { type: Boolean },
    modal: { type: Boolean },
    nested: { type: Boolean },
    dismissible: { type: Boolean },
    snapPoints: { type: Array },
    activeSnapPoint: { type: [Number, null] },
    setActiveSnapPoint: { type: Function },
    fadeFromIndex: { type: Number },
    onOpenChange: { type: Function },
    onSnapPointChange: { type: Function },
  },
  emits: ["update:open", "snapPointChange"],
});
</script>
