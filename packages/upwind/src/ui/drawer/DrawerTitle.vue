<template>
  <DrawerTitle
    v-bind="$props"
    class="text-lg font-semibold leading-none tracking-tight"
  >
    <slot />
  </DrawerTitle>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { DrawerTitle } from "vaul-vue";

export default defineComponent({
  components: {
    DrawerTitle,
  },
  props: {
    as: { type: [String, Object] },
  },
});
</script>
