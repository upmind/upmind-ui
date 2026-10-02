<template>
  <MainOrganism v-slot="{ template }">
    <h2 data-heading>{{ template }}</h2>

    <FrameLayout ref="layout" v-mark :title="title">
      <template v-if="fills.includes('image')" #image>
        <img data-piece="page-image" alt="" />
      </template>

      <template v-if="fills.includes('pricing')" #pricing>
        <p data-piece="page-pricing">{{ title }}</p>
      </template>

      <template v-if="fills.includes('terms')" #terms>
        <p data-piece="page-terms">Terms</p>
      </template>
    </FrameLayout>
  </MainOrganism>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import FrameLayout from "./FrameLayout.vue";
import MainOrganism from "./MainOrganism.vue";
import type { Directive } from "vue";

withDefaults(defineProps<{ fills?: string[]; title?: string }>(), {
  fills: () => [],
  title: "Domain"
});

const vMark: Directive<HTMLElement> = {
  mounted: el => el.setAttribute("data-marked", "")
};

const layout = ref<InstanceType<typeof FrameLayout> | null>(null);

defineExpose({ layout });
</script>

<style scoped>
h2 {
  margin: 0;
}
</style>
