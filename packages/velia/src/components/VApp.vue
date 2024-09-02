<template>
  <v-hero-image>
    <v-header />
    <v-hero>
      <v-hero-content />
    </v-hero>
  </v-hero-image>
  <v-content>
    <slot />
  </v-content>
  <v-footer />
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- components
import {
  VHeader,
  VFooter,
  VContent,
  VHero,
  VHeroContent,
  VHeroImage,
} from "@velia/velia";

export default defineComponent({
  components: { VHeader, VFooter, VContent, VHero, VHeroContent, VHeroImage },
});
</script>
