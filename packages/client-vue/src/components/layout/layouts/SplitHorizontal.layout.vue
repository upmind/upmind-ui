<template>
  <Root :class="styles.split.root">
    <article :class="styles.split.container">
      <!-- Content -->
      <div :class="styles.split.content.root">
        <div :class="styles.split.content.container">
          <section :class="styles.split.content.header">
            <slot name="controls" />
            <slot name="navigation" />
            <slot name="actions" />
            <slot name="content-header" />
            <slot name="aside" />
            <slot name="aside-footer" />
          </section>

          <section :class="styles.split.content">
            <slot name="content" />
            <slot name="default" />
          </section>
        </div>

        <!-- Footer -->
        <footer :class="styles.split.footer" />
      </div>
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
