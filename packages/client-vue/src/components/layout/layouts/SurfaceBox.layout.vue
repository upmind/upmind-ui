<template>
  <Root :class="styles.surfaceBox.root">
    <div :class="styles.surfaceBox.container">
      <Card as="article" :class="styles.surfaceBox.card" spacious>
        <!-- Content Header -->
        <section :class="styles.surfaceBox.contentHeader">
          <slot name="controls" />
          <slot name="navigation" />
          <slot name="actions" />
          <slot name="content-header" />
          <slot name="aside" />
          <slot name="aside-footer" />
        </section>

        <!-- Content -->
        <section :class="styles.surfaceBox.content">
          <slot name="content" />
          <slot name="default" />
        </section>
      </Card>
    </div>
  </Root>
</template>

<script lang="ts" setup>
import { computed, type ComputedRef } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../layout.config";
import type { VariantProps } from "../types";

// --- components
import { Card } from "@upmind-automation/upmind-ui";
import Root from "../components/root/Root.vue";

defineProps<VariantProps>();

const meta = computed(() => ({}));

const styles = useStyles(["surfaceBox"], meta, config) as ComputedRef<{
  surfaceBox: {
    root: string;
    container: string;
    header: string;
    card: string;
    contentHeader: string;
    content: string;
    footer: string;
  };
}>;
</script>
