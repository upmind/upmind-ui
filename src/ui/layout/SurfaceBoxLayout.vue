<template>
  <div :class="styles.surfaceBox.root">
    <div :class="styles.surfaceBox.container">
      <!-- Header -->
      <header :class="styles.surfaceBox.header">
        <slot name="header-left" />
      </header>

      <Card as="article" :class="styles.surfaceBox.card" spacious>
        <!-- Content Header -->
        <section :class="styles.surfaceBox.contentHeader">
          <slot name="content-header" />
        </section>

        <!-- Content -->
        <section :class="styles.surfaceBox.content">
          <slot name="content" />
          <slot name="default" />
        </section>
      </Card>

      <!-- Footer -->
      <footer :class="styles.surfaceBox.footer">
        <slot name="footer-content" />
        <slot name="footer-copyright" />
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, type ComputedRef } from "vue";
import { useStyles } from "../../utils";
import config from "./layout.config";
import type { VariantProps } from "./types";
// --- components
import Card from "../card/Card.ce.vue";

defineProps<VariantProps>();

const meta = computed(() => ({}));

const styles = useStyles(["surfaceBox"], meta, config) as ComputedRef<{
  surfaceBox: {
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
