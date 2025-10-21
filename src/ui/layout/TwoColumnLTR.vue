<template>
  <article :class="styles.twoColumnLTR.root">
    <!-- Header -->
    <header :class="styles.twoColumnLTR.row">
      <div :class="styles.twoColumnLTR.header.content">
        <slot name="header-left" />
      </div>

      <div :class="styles.twoColumnLTR.header.aside">
        <slot name="header-right" />
      </div>
    </header>

    <!-- Content Header -->
    <section :class="styles.twoColumnLTR.row">
      <div :class="styles.twoColumnLTR.contentHeader.content">
        <slot name="content-header" />
      </div>

      <div :class="styles.twoColumnLTR.contentHeader.aside" />
    </section>

    <!-- Content / Aside -->
    <section :class="styles.twoColumnLTR.row">
      <div :class="styles.twoColumnLTR.content.content">
        <slot name="content" />
      </div>

      <aside :class="styles.twoColumnLTR.content.aside">
        <slot name="aside" />
      </aside>
    </section>

    <!-- Spacer -->
    <div :class="styles.twoColumnLTR.row">
      <div :class="styles.twoColumnLTR.spacer.content" />

      <div :class="styles.twoColumnLTR.spacer.aside" />
    </div>

    <!-- Footer -->
    <footer :class="styles.twoColumnLTR.footer.row">
      <div :class="styles.twoColumnLTR.footer.content">
        <slot name="footer-copyright" />
        <slot name="footer-actions" />
      </div>

      <div :class="styles.twoColumnLTR.footer.aside">
        <slot name="footer-content" />
      </div>
    </footer>
  </article>
</template>

<script lang="ts" setup>
import { computed, type ComputedRef } from "vue";
import { useStyles } from "../../utils";
import config from "./layout.config";
import type { VariantProps } from "./types";

defineProps<VariantProps>();

const meta = computed(() => ({}));

const styles = useStyles(
  [
    "twoColumnLTR",
    "twoColumnLTR.header",
    "twoColumnLTR.contentHeader",
    "twoColumnLTR.content",
    "twoColumnLTR.spacer",
    "twoColumnLTR.footer"
  ],
  meta,
  config
) as ComputedRef<{
  twoColumnLTR: {
    root: string;
    row: string;
    header: {
      content: string;
      aside: string;
    };
    contentHeader: {
      content: string;
      aside: string;
    };
    content: {
      content: string;
      aside: string;
    };
    spacer: {
      content: string;
      aside: string;
    };
    footer: {
      row: string;
      content: string;
      aside: string;
    };
  };
}>;
</script>
