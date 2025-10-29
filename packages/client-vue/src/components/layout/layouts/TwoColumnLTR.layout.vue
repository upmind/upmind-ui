<template>
  <article :class="styles.twoColumnLTR.root">
    <!-- Header -->
    <header :class="styles.twoColumnLTR.row">
      <div :class="styles.twoColumnLTR.header.root" />
      <div :class="styles.twoColumnLTR.header.aside" />
    </header>

    <!-- Content Header -->
    <section :class="styles.twoColumnLTR.row" class="hidden lg:flex">
      <div :class="styles.twoColumnLTR.contentHeader.root">
        <slot name="navigation" />
        <slot name="controls" />
        <slot name="actions" />
        <div>
          <slot name="content-header" />
        </div>
      </div>

      <div :class="styles.twoColumnLTR.contentHeader.aside" />
    </section>

    <!-- Content / Aside -->
    <section :class="styles.twoColumnLTR.row">
      <div :class="styles.twoColumnLTR.content.root">
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

      <div :class="styles.twoColumnLTR.content.aside">
        <aside :class="styles.twoColumnLTR.content.asideInner">
          <slot name="aside" />
          <slot name="aside-footer" />
        </aside>
      </div>
    </section>

    <!-- Spacer -->
    <div :class="styles.twoColumnLTR.spacer.row">
      <div :class="styles.twoColumnLTR.spacer.root" />
      <div :class="styles.twoColumnLTR.spacer.aside" />
    </div>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { computed, type ComputedRef } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "../layout.config";

// --- types
import type { VariantProps } from "../types";

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
      root: string;
      aside: string;
    };
    contentHeader: {
      root: string;
      aside: string;
    };
    content: {
      root: string;
      aside: string;
      asideInner: string;
    };
    spacer: {
      row: string;
      root: string;
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
