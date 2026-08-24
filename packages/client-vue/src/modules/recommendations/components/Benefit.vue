<template>
  <div :class="benefitRootVariants()">
    <Icon v-bind="getIcon" fallback="dot" :class="benefitIconVariants()" />
    <p :class="benefitLabelVariants()">{{ label }}</p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Icon } from "../../../components/icon";
import {
  benefitRootVariants,
  benefitIconVariants,
  benefitLabelVariants
} from "../variants";
import { isString } from "lodash-es";
import type { RecommendationBenefitProps } from "./types";

const props = defineProps<RecommendationBenefitProps>();

const getIcon = computed(() => {
  if (isString(props.icon)) return { icon: props.icon };
  if (props.icon?.icon) return props.icon;
  return { icon: "dot" };
});
</script>
