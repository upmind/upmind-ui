<template>
  <footer :class="styles.footer.root">
    <div :class="styles.footer.container">
      <div :class="styles.footer.actions">
        <slot name="footer-copyright" />
      </div>

      <div :class="styles.footer.content">
        <slot name="footer-content" />
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
// --- internal
import config from "../footer.config";
import { useRoutingEngine } from "@upmind-automation/headless";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import { computed } from "vue";
import { FOOTER_TEMPLATE } from "../types";

const { currentRoute } = useRoutingEngine();

const meta = computed(() => ({
  variant: currentRoute.value?.meta?.template || FOOTER_TEMPLATE.SPLIT
}));

const styles = useStyles(["footer"], meta, config, {}) as ComputedRef<{
  footer: {
    root: string;
    container: string;
    actions: string;
    content: string;
  };
}>;
</script>
