<template>
  <article
    :class="styles.domain.card.root"
    class="w-full border-b py-4! pl-5 last:border-b-0"
  >
    <header :class="styles.domain.card.header">
      <Skeleton :class="styles.domain.card.icon" class="h-8 w-8 pr-2" />

      <div :class="styles.domain.card.content" class="gap-1">
        <Skeleton :class="styles.domain.card.label" class="h-4 w-16">
          Label
        </Skeleton>

        <section :class="styles.domain.card.container">
          <Skeleton :class="[styles.domain.card.title]" class="h-7 w-auto">
            <div class="h-6 min-w-44" :class="[`mx-${randomTitleMargin}`]" />
          </Skeleton>
        </section>

        <Skeleton class="h-5" :class="`w-${randomDescWidth}`" />
      </div>
    </header>

    <footer :class="styles.domain.card.footer.root">
      <span class="pr-4">
        <strong
          :class="styles.domain.card.prices.current"
          class="flex items-end gap-x-1"
        >
          <Skeleton class="inline-block h-8 w-16 px-2" />
          <Skeleton class="inline-block h-5 w-6" />
        </strong>
      </span>
      <Skeleton class="h-12 w-full rounded-full md:w-20" />
    </footer>
  </article>
</template>

<script setup lang="ts">
import { Skeleton, useStyles } from "@upmind-automation/upmind-ui";
import config from "../domain.config";
import type { ComputedRef } from "vue";
import { ref } from "vue";

const descWidthOptions = [56, 64];
const randomDescWidth =
  descWidthOptions[Math.floor(Math.random() * descWidthOptions.length)];

const titleMarginOptions = [1, 2, 4];
const randomTitleMargin =
  titleMarginOptions[Math.floor(Math.random() * titleMarginOptions.length)];

const styles = useStyles(
  ["domain.card", "domain.card.prices", "domain.card.footer"],
  {},
  config
) as ComputedRef<{
  domain: {
    card: {
      root: string;
      header: string;
      icon: string;
      content: string;
      container: string;
      label: string;
      title: string;
      sld: string;
      tld: string;
      promotion: string;
      footer: {
        root: string;
      };
      prices: {
        root: string;
        regular: string;
        current: string;
      };
    };
  };
}>;
</script>
