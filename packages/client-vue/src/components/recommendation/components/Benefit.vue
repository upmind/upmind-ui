<template>
  <div :class="styles.recommendation.benefit">
    <span :class="styles.recommendation.benefitIconContainer">
      <Icon
        :icon="icon.icon && !iconError ? icon.icon : 'dot'"
        :class="styles.recommendation.benefitIcon"
        @error="iconError = true"
      />
    </span>

    <p :class="styles.recommendation.benefitLabel">{{ label }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref, type ComputedRef } from "vue";
import { Icon, type IconProps } from "@upmind-automation/upwind";
import { useStyles } from "@upmind-automation/upwind";
import config from "../config.cva";

const styles = useStyles(["recommendation"], {}, config) as ComputedRef<{
  recommendation: {
    benefit: string;
    benefitIconContainer: string;
    benefitIcon: string;
    benefitLabel: string;
  };
}>;

const iconError = ref(false);

defineProps<{
  label: string;
  icon: IconProps;
}>();
</script>
