<template>
  <div :class="styles.canvasCard.root">
    <div :class="styles.canvasCard.container">
      <Card as="article" :class="styles.canvasCard.card" spacious>
        <!-- Content Header -->
        <section :class="styles.canvasCard.contentHeader">
          <slot name="controls" />
          <slot name="navigation" />
          <slot name="actions" />
          <slot name="content-header" />
          <slot name="aside" />
          <slot name="aside-footer" />
        </section>

        <!-- Content -->
        <section :class="styles.canvasCard.content">
          <slot name="content" />
          <slot name="default" />
        </section>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type ComputedRef } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../layout.config";
import type { VariantProps } from "../types";

// --- components
import { Card } from "@upmind-automation/upmind-ui";

defineProps<VariantProps>();

const meta = computed(() => ({}));

const styles = useStyles(["canvasCard"], meta, config) as ComputedRef<{
  canvasCard: {
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
