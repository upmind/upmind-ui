<template>
  <DrawerOverlay v-bind="$props" class="fixed inset-0 z-50 bg-black/80" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { DrawerOverlay } from "vaul-vue";

export default defineComponent({
  components: {
    DrawerOverlay,
  },
  props: {
    as: { type: [String, Object] },
    asChild: { type: Boolean },
    forceMount: { type: Boolean },
  },
});
</script>
