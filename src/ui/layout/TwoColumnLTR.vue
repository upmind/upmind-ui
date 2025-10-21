<template>
  <article :class="styles.twoColumnLTR.root">
    <header :class="styles.twoColumnLTR.header.row">
      <div :class="styles.twoColumnLTR.header.contentWrapper">
        <div :class="styles.twoColumnLTR.header.contentInner">
          <slot name="header-left" />
        </div>
      </div>

      <div :class="styles.twoColumnLTR.header.asideWrapper">
        <div :class="styles.twoColumnLTR.header.asideInner">
          <slot name="header-right" />
        </div>
      </div>
    </header>

    <section :class="styles.twoColumnLTR.contentHeader.row">
      <div :class="styles.twoColumnLTR.contentHeader.contentWrapper">
        <div :class="styles.twoColumnLTR.contentHeader.contentInner">
          <slot name="content-header" />
        </div>
      </div>

      <div :class="styles.twoColumnLTR.contentHeader.asideWrapper">
        <div :class="styles.twoColumnLTR.contentHeader.asideInner" />
      </div>
    </section>

    <section :class="styles.twoColumnLTR.content.row">
      <div :class="styles.twoColumnLTR.content.contentWrapper">
        <div :class="styles.twoColumnLTR.content.contentInner">
          <slot name="content" />
        </div>
      </div>

      <div :class="styles.twoColumnLTR.content.asideWrapper">
        <aside :class="styles.twoColumnLTR.content.asideInner">
          <slot name="aside" />
        </aside>
      </div>
    </section>

    <div :class="styles.twoColumnLTR.spacer.row">
      <div :class="styles.twoColumnLTR.spacer.contentWrapper">
        <div :class="styles.twoColumnLTR.spacer.contentInner" />
      </div>

      <div :class="styles.twoColumnLTR.spacer.asideWrapper">
        <div :class="styles.twoColumnLTR.spacer.asideInner" />
      </div>
    </div>

    <footer :class="styles.twoColumnLTR.footer.row">
      <div :class="styles.twoColumnLTR.footer.contentWrapper">
        <div :class="styles.twoColumnLTR.footer.contentInner">
          <slot name="footer-copyright" />
          <slot name="footer-actions" />
        </div>
      </div>

      <div :class="styles.twoColumnLTR.footer.asideWrapper">
        <div :class="styles.twoColumnLTR.footer.asideInner">
          <slot name="footer-content" />
        </div>
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
    header: {
      row: string;
      contentWrapper: string;
      contentInner: string;
      asideWrapper: string;
      asideInner: string;
    };
    contentHeader: {
      row: string;
      contentWrapper: string;
      contentInner: string;
      asideWrapper: string;
      asideInner: string;
    };
    content: {
      row: string;
      contentWrapper: string;
      contentInner: string;
      asideWrapper: string;
      asideInner: string;
    };
    spacer: {
      row: string;
      contentWrapper: string;
      contentInner: string;
      asideWrapper: string;
      asideInner: string;
    };
    footer: {
      row: string;
      contentWrapper: string;
      contentInner: string;
      asideWrapper: string;
      asideInner: string;
    };
  };
}>;
</script>
