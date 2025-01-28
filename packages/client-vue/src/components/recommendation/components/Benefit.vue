<template>
  <div :class="styles.recommendation.benefit.root">
    <Icon
      v-bind="icon"
      fallback-icon="dot"
      :class="styles.recommendation.benefit.icon"
    />
    <p :class="styles.recommendation.benefit.label">{{ label }}</p>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { type ComputedRef } from "vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../config.cva";

// --- components
import { Icon } from "@upmind-automation/upmind-ui";

// --- types
import { type RecommendationBenefitProps } from "../types";

const styles = useStyles(
  ["recommendation.benefit"],
  {},
  config
) as ComputedRef<{
  recommendation: {
    benefit: {
      root: string;
      iconContainer: string;
      icon: string;
      label: string;
    };
  };
}>;

defineProps<RecommendationBenefitProps>();
</script>
