<template>
  <figure v-if="src" :class="styles.card.image.root">
    <img :src="src" :alt="alt" :class="styles.card.image.img" />
  </figure>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./subproduct-card.config";

// --- types
import type { SubproductCardImage } from "./types";

const props = defineProps<SubproductCardImage>();

const meta = computed(() => ({
  isMinimal: props.minimal,
  isDropdown: props.dropdown
}));

const styles = useStyles(["card.image"], meta, config);
</script>
