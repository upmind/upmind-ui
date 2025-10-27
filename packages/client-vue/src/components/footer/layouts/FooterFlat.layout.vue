<template>
  <footer :class="styles.footer.root">
    <div :class="styles.footer.container">
      <div :class="styles.footer.actions">
        <slot name="footer-copyright" />
        <slot name="footer-actions" />
      </div>

      <div :class="styles.footer.content">
        <slot name="footer-content" />
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import config from "../footer.config";
import { useFooter } from "../useFooter";

// --- utils
import { useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";

const { templateName } = useFooter();

const meta = computed(() => ({
  variant: templateName.value
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
