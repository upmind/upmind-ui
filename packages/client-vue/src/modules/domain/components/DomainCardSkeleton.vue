<template>
  <article
    :class="cn([styles.card.root, styles.card.skeleton.root])"
    class="border-surface border-t"
  >
    <header :class="styles.card.header.root">
      <div :class="styles.card.header.details.root" class="flex flex-col gap-2">
        <Skeleton :active="meta.isActive" class="h-4 w-20" />

        <section :class="styles.card.header.details.title.root">
          <Skeleton
            :active="meta.isActive"
            :class="[styles.card.skeleton.title, `w-${randomTitleWidth}`]"
          />
        </section>

        <Skeleton
          :active="meta.isActive"
          class="h-4"
          :class="[`w-${randomDescWidth}`]"
        />
      </div>
    </header>

    <footer
      :class="styles.card.footer.root"
      class="mt-4 flex-col lg:mt-0 lg:flex-row"
    >
      <section :class="styles.card.footer.price.root">
        <Skeleton :active="meta.isActive" class="h-6 w-24" />
      </section>

      <Skeleton
        :active="meta.isActive"
        class="button-radius h-11"
        :class="styles.card.skeleton.button"
      />
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Skeleton } from "@upmind-automation/upmind-ui";
import { cn } from "@upmind-automation/upmind-ui";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../domain.config";
import type { DomainCardSkeletonProps } from "../types";
const props = withDefaults(defineProps<DomainCardSkeletonProps>(), {
  active: true,
  exactMatch: false
});

const meta = computed(() => ({
  isActive: props.active,
  isExactMatch: props.exactMatch
}));

const styles = useStyles(
  [
    "card",
    "card.header",
    "card.footer",
    "card.header.details",
    "card.header.details.title",
    "card.header.details.pricing",
    "card.footer.price",
    "card.footer.button",
    "card.skeleton"
  ],
  meta,
  config
);

// methods
const descWidthOptions = [56, 64];
const randomDescWidth =
  descWidthOptions[Math.floor(Math.random() * descWidthOptions.length)];

const titleWidthOptions = [56, 64, 72];
const randomTitleWidth =
  titleWidthOptions[Math.floor(Math.random() * titleWidthOptions.length)];
</script>
