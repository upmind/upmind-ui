<template>
  <article :class="styles.twoColumnRTL.root">
    <!-- Header Spacer -->
    <div :class="styles.twoColumnRTL.row">
      <div :class="styles.twoColumnRTL.header.aside" />
      <div :class="styles.twoColumnRTL.header.root" />
    </div>

    <!-- Content / Aside -->
    <section :class="styles.twoColumnRTL.row">
      <div :class="styles.twoColumnRTL.content.aside.root">
        <div :class="styles.twoColumnRTL.content.aside.container">
          <div :class="styles.twoColumnRTL.content.aside.header">
            <slot name="content-header" />
            <slot name="navigation" />
            <slot name="controls" />
            <slot name="actions" />
          </div>

          <aside :class="styles.twoColumnRTL.content.aside.footer">
            <slot name="aside" />
            <slot name="aside-footer" />
          </aside>
        </div>
      </div>

      <div :class="styles.twoColumnRTL.content.root">
        <div class="empty:hidden has-[:where(.hidden)]:hidden lg:hidden">
          <slot name="content-header" />
        </div>
        <div class="empty:hidden has-[:where(.hidden)]:hidden lg:hidden">
          <slot name="aside" />
        </div>
        <div class="empty:hidden has-[:where(.hidden)]:hidden lg:hidden">
          <slot name="aside-footer" />
        </div>
        <slot name="default" />
        <slot name="content" />
      </div>
    </section>

    <!-- Spacer -->
    <div :class="styles.twoColumnRTL.spacer.row">
      <div :class="styles.twoColumnRTL.spacer.aside" />
      <div :class="styles.twoColumnRTL.spacer.root" />
    </div>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { computed, type ComputedRef } from "vue";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../layout.config";
import type { VariantProps } from "../types";

defineProps<VariantProps>();

const meta = computed(() => ({}));

const styles = useStyles(
  [
    "twoColumnRTL",
    "twoColumnRTL.header",
    "twoColumnRTL.content",
    "twoColumnRTL.content.aside",
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
      root: string;
    };
    content: {
      root: string;
      aside: {
        root: string;
        container: string;
        header: string;
        footer: string;
      };
    };
    spacer: {
      row: string;
      aside: string;
      root: string;
    };
    footer: {
      row: string;
      aside: string;
      content: string;
    };
  };
}>;
</script>
