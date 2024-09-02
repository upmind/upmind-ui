<template>
  <v-hero-image>
    <v-hero-container>
      <v-header />
      <v-hero-content-container>
        <slot name="hero" />
      </v-hero-content-container>
    </v-hero-container>
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
  VHeroImage,
  VHeroContentContainer,
  VHeroContainer,
} from "@velia/velia";

export default defineComponent({
  components: {
    VHeader,
    VFooter,
    VContent,
    VHeroImage,
    VHeroContentContainer,
    VHeroContainer,
  },
});
</script>
