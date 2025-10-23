<template>
  <article :class="styles.twoColumnRTL.root">
    <!-- Header -->
    <header :class="styles.twoColumnRTL.row">
      <div :class="styles.twoColumnRTL.header.aside">
        <slot name="header-left" />
      </div>

      <div :class="styles.twoColumnRTL.header.content">
        <slot name="header-right" />
      </div>
    </header>

    <!-- Content / Aside -->
    <section :class="styles.twoColumnRTL.row">
      <div :class="styles.twoColumnRTL.content.aside">
        <div :class="styles.twoColumnRTL.content.asideInner">
          <div>
            <slot name="content-header" />
          </div>

          <aside :class="styles.twoColumnRTL.content.asideSticky">
            <slot name="aside" />
            <slot name="aside-footer" />
          </aside>
        </div>
      </div>

      <div :class="styles.twoColumnRTL.content.content">
        <slot name="content" />
      </div>
    </section>

    <!-- Spacer -->
    <div :class="styles.twoColumnRTL.row">
      <div :class="styles.twoColumnRTL.spacer.aside" />

      <div :class="styles.twoColumnRTL.spacer.content" />
    </div>

    <!-- Footer -->
    <footer :class="styles.twoColumnRTL.footer.row">
      <div :class="styles.twoColumnRTL.footer.aside">
        <slot name="footer-content" />
      </div>

      <div :class="styles.twoColumnRTL.footer.content">
        <slot name="footer-copyright" />
        <slot name="footer-actions" />
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
    "twoColumnRTL",
    "twoColumnRTL.header",
    "twoColumnRTL.content",
    "twoColumnRTL.spacer",
    "twoColumnRTL.footer"
  ],
  meta,
  config
) as ComputedRef<{
  twoColumnRTL: {
    root: string;
    row: string;
    header: {
      aside: string;
      content: string;
    };
    content: {
      aside: string;
      asideInner: string;
      asideSticky: string;
      content: string;
    };
    spacer: {
      aside: string;
      content: string;
    };
    footer: {
      row: string;
      aside: string;
      content: string;
    };
  };
}>;
</script>
