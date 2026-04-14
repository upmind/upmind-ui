<template>
  <Root :class="styles.split.root">
    <article :class="styles.split.container">
      <section>
        <slot name="controls" />
        <slot name="navigation" />
        <slot name="actions" />
        <slot name="content-header" />
        <slot name="aside" />
        <slot name="aside-footer" />
      </section>

      <slot name="content" />
      <slot name="default" />

      <!-- Footer -->
      <footer :class="styles.split.footer" />
    </article>

    <!-- Filler aside -->
    <div :class="styles.split.aside" />
  </Root>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- components
import Root from "../components/root/Root.vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../layout.config";

// --- types
import type { VariantProps } from "../types";

defineProps<VariantProps>();

const meta = computed(() => ({}));

const styles = useStyles(["split", "split.content"], meta, config);
</script>
