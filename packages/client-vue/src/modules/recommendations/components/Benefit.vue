<template>
  <div :class="styles.recommendation.benefit.root">
    <Icon
      v-bind="getIcon"
      fallback="dot"
      :class="styles.recommendation.benefit.icon"
    />
    <p :class="styles.recommendation.benefit.label">{{ label }}</p>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { type ComputedRef, computed } from "vue";
import { isString } from "lodash-es";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../recommendation.config";

// --- components
import { Icon } from "@upmind-automation/upmind-ui";

// --- types
import { type RecommendationBenefitProps } from "./types";

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

const props = defineProps<RecommendationBenefitProps>();

const getIcon = computed(() => {
  if (isString(props.icon)) return { icon: props.icon };
  if (props.icon?.icon) return props.icon;
  return { icon: "dot" };
});
</script>
