<template>
  <div :class="styles.recommendation.benefit.root">
    <span :class="styles.recommendation.benefit.iconContainer">
      <Icon
        v-bind="icon"
        fallback-icon="dot"
        :class="styles.recommendation.benefit.icon"
      />
    </span>

    <p :class="styles.recommendation.benefit.label">{{ label }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, type ComputedRef } from "vue";
import { Icon, type IconProps } from "@upmind-automation/upwind";
import { useStyles } from "@upmind-automation/upwind";
import config from "../config.cva";

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

defineProps<{
  label: string;
  icon: IconProps;
}>();
</script>
