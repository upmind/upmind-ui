<template>
  <footer :class="styles.footer.root">
    <div :class="styles.footer.container">
      <div :class="styles.footer.left">
        <div class="hidden lg:block">
          <slot name="footer-copyright" />
        </div>
        <div :class="styles.footer.actions">
          <slot name="footer-actions" />
        </div>
      </div>

      <div :class="styles.footer.right">
        <div class="lg:hidden">
          <slot name="footer-copyright" />
        </div>
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
    left: string;
    right: string;
  };
}>;
</script>
