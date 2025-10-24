<template>
  <section :class="styles.header.root">
    <div :class="styles.header.details" ref="detailsRef">
      <hgroup class="flex flex-col gap-6">
        <Skeleton class="h-14 w-96" />

        <div class="gap- flex flex-col gap-1">
          <Skeleton :class="styles.header.price" class="mr-6 h-8 w-full" />
          <div class="w-full pr-6">
            <Skeleton :class="styles.header.price" class="mr-12 h-8 w-full" />
          </div>
          <Skeleton :class="styles.header.price" class="h-8 w-65" />
        </div>
      </hgroup>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Skeleton, useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./product-hero.config";

// --- types
import type { ProductHeaderProps } from "../types";
import type { ComputedRef } from "vue";

const styles = useStyles(["header"], {}, config) as ComputedRef<{
  header: {
    root: string;
    details: string;
    title: string;
    description: string;
    price: string;
    aside: string;
  };
}>;
</script>
