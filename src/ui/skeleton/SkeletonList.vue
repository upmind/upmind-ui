<template>
  <section :class="styles.skeletonList.root" role="status">
    <div
      v-for="row in props.rows"
      :key="`skeleton-row-${row}`"
      :class="styles.skeletonList.rows"
    >
      <div>
        <div :class="styles.skeletonList.line1"></div>
        <div :class="styles.skeletonList.line2"></div>
      </div>
      <div :class="styles.skeletonList.line3"></div>
    </div>

    <span class="sr-only">Loading List...</span>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
// --- internal
import config from "./skeleton.config";
import { useStyles } from "../../utils";
// --- types
import type { SkeletonListProps } from "./types";
const props = withDefaults(defineProps<SkeletonListProps>(), {
  rows: 5
});

const meta = computed(() => ({
  // ---
}));

const styles = useStyles("skeletonList", meta, config, props.uiConfig ?? {});
</script>
