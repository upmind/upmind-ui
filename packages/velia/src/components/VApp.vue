<template>
  <div :style="backgroundImage" class="pb-16">
    <v-header />
    <v-hero>
      <v-hero-content />
    </v-hero>
  </div>
  <v-content>
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
import { VHeader, VFooter, VContent, VHero, VHeroContent } from "@velia/velia";

export default defineComponent({
  components: { VHeader, VFooter, VContent, VHero, VHeroContent },

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
