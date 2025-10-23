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
import { computed, useSlots } from "vue";

// --- internal
import config from "../footer.config";
import { useRoutingEngine } from "@upmind-automation/headless";

// --- utils
import { useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import { FOOTER_TEMPLATE } from "../types";

const { currentRoute } = useRoutingEngine();

const meta = computed(() => ({
  variant: currentRoute.value?.meta?.template || FOOTER_TEMPLATE.DEFAULT
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
