<template>
  <figure v-if="src" :class="styles.card.image.root">
    <img :src="src" :alt="alt" :class="styles.card.image.img" />
  </figure>
</template>

<script lang="ts" setup>
// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./subproduct-card.config";

// --- types
import type { SubproductCardImage } from "./types";

defineProps<SubproductCardImage>();

const styles = useStyles(["card.image"], {}, config);
</script>
