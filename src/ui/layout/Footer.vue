<template>
  <footer
    v-if="meta.hasFooter"
    :class="styles.footer.root"
    data-testid="footer"
  >
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
import config from "./layout.config";

// --- utils
import { isEmptySlot } from "./utils";
import { useStyles } from "../../utils";

// --- types
import type { ComputedRef } from "vue";

const slots = useSlots();
const meta = computed(() => ({
  hasFooter:
    !isEmptySlot("footer-content", slots) ||
    !isEmptySlot("footer-actions", slots) ||
    !isEmptySlot("footer-copyright", slots)
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
