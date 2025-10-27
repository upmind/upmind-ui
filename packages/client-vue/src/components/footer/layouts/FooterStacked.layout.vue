<template>
  <footer :class="styles.footer.root" data-testid="footer">
    <div :class="styles.footer.container">
      <section
        :class="styles.footer.actions"
        aria-label="Language and currency preferences"
      >
        <slot name="footer-actions" />
      </section>

      <section :class="styles.footer.content">
        <slot name="footer-content" />
        <slot name="footer-copyright" />
      </section>
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
