<template>
  <div :style="backgroundImage" class="pb-16">
    <v-header />
    <div class="px-6 py-16">
      <slot name="hero" />
    </div>
  </div>
  <v-content class="-mt-16 px-6 pb-8">
    <slot />
  </v-content>
  <v-footer />
</template>

<script>
// --- external
import { defineComponent, ref } from "vue";

// --- internal
import coverImage from "../assets/cover.jpeg";

// --- components
import { VHeader, VFooter, VContent } from "@velia/velia";

export default defineComponent({
  components: { VHeader, VFooter, VContent },

  setup() {
    const backgroundImage = ref({
      backgroundImage: `linear-gradient(rgba(20, 46, 77, 0.5), rgba(20, 46, 77, 1)), url(${coverImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    });

    return {
      backgroundImage,
    };
  },
});
</script>
