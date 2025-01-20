<template>
  <section class="flex flex-col gap-2">
    <template v-for="benefit in benefits" :key="benefit.label">
      <RecommendationBenefit v-bind="benefit" />
    </template>
  </section>
</template>

<script lang="ts" setup>
import type { Benefit } from "@upmind-automation/headless";
import RecommendationBenefit from "./Benefit.vue";
defineProps<{
  benefits?: Benefit[];
}>();
</script>
