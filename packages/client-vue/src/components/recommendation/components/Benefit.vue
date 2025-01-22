<template>
  <div :class="styles.recommendation.benefit.root">
    <span :class="styles.recommendation.benefit.iconContainer">
      <Icon
        :icon="icon.icon && !iconError ? icon.icon : 'dot'"
        :class="styles.recommendation.benefit.icon"
        @error="iconError = true"
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

const iconError = ref(false);

defineProps<{
  label: string;
  icon: IconProps;
}>();
</script>
