<template>
  <Root :class="styles.canvasCard.root" :overflow="overflow">
    <div :class="styles.canvasCard.container">
      <Card as="article" :class="styles.canvasCard.card" size="lg">
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
  </Root>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../layout.config";

// --- components
import { Card } from "@upmind-automation/upmind-ui";
import Root from "../components/root/Root.vue";

// --- types
import type { VariantProps } from "../types";

defineProps<VariantProps>();

const meta = computed(() => ({}));

const styles = useStyles(["canvasCard"], meta, config);
</script>
