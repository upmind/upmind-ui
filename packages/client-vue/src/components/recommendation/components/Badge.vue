<template>
  <Badge
    v-if="badge"
    :label="badge"
    variant="flat"
    size="lg"
    :class="styles.recommendation.badge"
  />
</template>

<script lang="ts" setup>
import { type ComputedRef } from "vue";
import { Badge } from "@upmind-automation/upwind";
import { useStyles } from "@upmind-automation/upwind";
import config from "../config.cva";

defineProps<{
  badge?: string;
}>();

const styles = useStyles(["recommendation"], {}, config) as ComputedRef<{
  recommendation: {
    badge: string;
  };
}>;
</script>
