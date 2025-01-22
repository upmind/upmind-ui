<template>
  <header :class="styles.checkout.header">
    <h5 :class="styles.checkout.title">
      {{ gateway.name }}
    </h5>

    <img
      v-if="!hasImgError"
      :src="`/gateways/${gateway_id}.png`"
      :alt="gateway.name"
      :class="styles.checkout.image"
      @error="hasImgError = true"
    />
  </header>
</template>

<script lang="ts" setup>
// --- external
import { ref } from "vue";

// --- internal
import config from "../../config.cva";
import { useStyles } from "@upmind-automation/upwind";

// --- types
import type { ComputedRef } from "vue";

// --- props
defineProps<{
  gateway: {
    name: string;
  };
  gateway_id: string;
}>();

const styles = useStyles(["checkout"], {}, config) as ComputedRef<{
  checkout: {
    header: string;
    title: string;
    image: string;
  };
}>;

const hasImgError = ref(false);
</script>
