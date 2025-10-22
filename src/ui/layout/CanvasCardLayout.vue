<template>
  <div :class="styles.canvasCard.root">
    <div :class="styles.canvasCard.container">
      <!-- Header -->
      <header :class="styles.canvasCard.header">
        <slot name="header-left" />
      </header>

      <Card as="article" :class="styles.canvasCard.card" spacious>
        <!-- Content Header -->
        <section :class="styles.canvasCard.contentHeader">
          <slot name="content-header" />
        </section>

        <!-- Content -->
        <section :class="styles.canvasCard.content">
          <slot name="content" />
          <slot name="default" />
        </section>
      </Card>

      <!-- Footer -->
      <footer :class="styles.canvasCard.footer">
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

const styles = useStyles(["canvasCard"], meta, config) as ComputedRef<{
  canvasCard: {
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
