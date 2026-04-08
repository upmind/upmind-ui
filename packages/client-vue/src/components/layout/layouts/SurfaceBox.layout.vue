<template>
  <Root :class="styles.surfaceBox.root">
    <div :class="styles.surfaceBox.container">
      <component
        :is="card ? 'article' : Card"
        :class="styles.surfaceBox.card"
        size="lg"
      >
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
        <component
          :is="card ? 'div' : 'section'"
          :class="styles.surfaceBox.content"
        >
          <slot name="content" />
          <slot name="default" />
        </component>
      </component>
    </div>
  </Root>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../layout.config";
import type { VariantProps } from "../types";
import { useSection } from "../../section/useSection";

// --- components
import { Card } from "@upmind-automation/upmind-ui";
import Root from "../components/root/Root.vue";

defineProps<VariantProps>();

const { card } = useSection();

const meta = computed(() => ({}));

const styles = useStyles(["surfaceBox"], meta, config);
</script>
