<template>
  <v-header />
  <v-content>
    <slot />
  </v-content>
  <v-footer />
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- components
import { VHeader, VFooter, VContent } from "@velia/velia";

export default defineComponent({
  components: { VHeader, VFooter, VContent },
});
</script>
