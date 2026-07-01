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
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import { Icon } from "@upmind-automation/upmind-ui";
import config from "../recommendations.config";
import { isString } from "lodash-es";
import type { RecommendationBenefitProps } from "./types";

const styles = useStyles(["recommendation.benefit"], {}, config);

const props = defineProps<RecommendationBenefitProps>();

const getIcon = computed(() => {
  if (isString(props.icon)) return { icon: props.icon };
  if (props.icon?.icon) return props.icon;
  return { icon: "dot" };
});
</script>
