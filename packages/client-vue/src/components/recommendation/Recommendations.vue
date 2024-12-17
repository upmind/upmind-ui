<template>
  <section v-auto-animate>
    <UpmContentSection>
      <slot name="header"> </slot>

      <RecommendationsCarousel
        :recommendations="props.recommendations"
        @resolve="doResolve"
      />

      <slot name="footer"></slot>
    </UpmContentSection>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import { UpmContentSection, UpmCard } from "@upmind-automation/client-vue";

// --- components
import { Button, Icon } from "@upmind-automation/upwind";
import RecommendationsCarousel from "./RecommendationsCarousel.vue";

// --- utils

// -----------------------------------------------------------------------------

const props = defineProps<{
  recommendations: any[];
}>();

const emit = defineEmits(["resolve"]);
// ---
const { t } = useI18n();

// --- basket setup

function doResolve(recommendation: any) {
  emit("resolve", recommendation);
}
</script>
