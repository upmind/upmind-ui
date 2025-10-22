<template>
  <div :class="styles.split.root">
    <article :class="styles.split.article">
      <!-- Header -->
      <header :class="styles.split.header">
        <slot name="header-left" />
      </header>

      <!-- Content -->
      <div :class="styles.split.contentWrapper">
        <div :class="styles.split.contentInner">
          <section :class="styles.split.contentHeader">
            <slot name="content-header" />
          </section>

          <section :class="styles.split.content">
            <slot name="content" />
            <slot name="default" />
          </section>
        </div>

        <!-- Footer -->
        <footer :class="styles.split.footer">
          <slot name="footer-content" />
          <slot name="footer-copyright" />
        </footer>
      </div>
    </article>

    <!-- Filler aside -->
    <div :class="styles.split.aside" />
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useStyles } from "../../utils";
import config from "./layout.config";

// --- types
import type { ComputedRef } from "vue";
import type { VariantProps } from "./types";

defineProps<VariantProps>();

const meta = computed(() => ({}));

const styles = useStyles(["split"], meta, config) as ComputedRef<{
  split: {
    root: string;
    article: string;
    header: string;
    contentWrapper: string;
    contentInner: string;
    contentHeader: string;
    content: string;
    footer: string;
    aside: string;
  };
}>;
</script>
