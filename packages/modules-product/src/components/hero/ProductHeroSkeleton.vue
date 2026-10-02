<template>
  <section :class="headerRootVariants()">
    <div :class="headerDetailsVariants()" ref="detailsRef">
      <hgroup class="flex flex-col gap-6">
        <Skeleton class="h-14 w-full lg:w-96" />

        <div class="gap- flex flex-col gap-1">
          <Skeleton :class="headerPriceVariants()" class="mr-6 h-8 w-full" />
          <div class="w-full pr-6">
            <Skeleton :class="headerPriceVariants()" class="mr-12 h-8 w-full" />
          </div>
          <Skeleton :class="headerPriceVariants()" class="h-8 w-65" />
        </div>
      </hgroup>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Skeleton } from "@upmind/ui";
import {
  headerRootVariants,
  headerDetailsVariants,
  headerPriceVariants
} from "./variants";

// --- types
</script>
