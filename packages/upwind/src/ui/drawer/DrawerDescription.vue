<template>
  <DrawerDescription v-bind="$props" :class="'text-sm text-muted-foreground'">
    <slot />
  </DrawerDescription>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { DrawerDescription } from "vaul-vue";

export default defineComponent({
  components: {
    DrawerDescription,
  },
  props: {
    asChild: Boolean,
  },
});
</script>
