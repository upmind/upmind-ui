<template>
  <div :class="cn(styles.product.config.root)">
    <div :class="styles.product.config.content">
      <div :class="styles.product.config.wrapper">
        <!-- heading -->
        <header :class="styles.product.config.heading">
          <div class="w-full">
            <Skeleton :class="styles.product.config.title" class="h-8 w-64">
              Product Title
            </Skeleton>

            <div class="mt-7 flex flex-col gap-y-1">
              <Skeleton class="h-5 w-5/12" />
              <Skeleton class="h-5 w-6/12" />
              <Skeleton class="h-5 w-24" />
            </div>

            <div class="mt-10 flex flex-col gap-y-1">
              <Skeleton class="h-7 w-56" />
              <div class="flex gap-x-2">
                <Skeleton class="h-28 w-6/12" />
                <Skeleton class="h-28 w-6/12" />
              </div>
              <div class="flex gap-x-2">
                <Skeleton class="h-28 w-6/12" />
                <Skeleton class="h-28 w-6/12" />
              </div>
            </div>

            <div class="mt-10 flex flex-col gap-y-1">
              <Skeleton class="h-7 w-56" />
              <Skeleton class="h-10 w-full" />
              <Skeleton class="h-10 w-full" />
              <Skeleton class="h-10 w-full" />
              <Skeleton class="mt-4 h-10 w-full" />
            </div>
          </div>
        </header>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// --- internal
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "../product.config";

// --- components
import { Skeleton } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";

const styles = useStyles(["product.config"], {}, config) as ComputedRef<{
  product: {
    config: {
      root: string;
      header: string;
      content: string;
      media: string;
      image: string;
      wrapper: string;
      heading: string;
      headingContent: string;
      title: string;
      text: string;
      fields: string;
      footer: string;
      itemtotal: string;
      bold: string;
    };
  };
}>;
</script>
