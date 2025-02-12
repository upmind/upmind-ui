<template>
  <header :class="styles.checkout.accordion.trigger.header">
    <h5 :class="styles.checkout.title">
      {{ gateway.name }}
    </h5>

    <img
      v-if="!hasImgError && gateway?.gateway_provider?.code"
      :src="`/gateways/${gateway?.gateway_provider?.code}.svg`"
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
import config from "../config.cva";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { GatewayTriggerProps } from "./types";

// --- props
defineProps<GatewayTriggerProps>();

const styles = useStyles(
  ["checkout", "checkout.accordion.trigger"],
  {},
  config
) as ComputedRef<{
  checkout: {
    accordion: {
      trigger: {
        header: string;
      };
    };
    title: string;
    image: string;
  };
}>;

const hasImgError = ref(false);
</script>
