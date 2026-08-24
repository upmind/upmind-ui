<template>
  <div :class="productConfigRootVariants()">
    <div :class="productConfigContentVariants()">
      <div :class="productConfigWrapperVariants()">
        <!-- heading -->
        <header :class="productConfigHeadingVariants()">
          <div class="w-full">
            <div class="flex flex-col gap-2">
              <Skeleton class="h-6 w-32" />
              <Skeleton class="h-10 w-full" />
              <Skeleton class="h-10 w-full" />
              <Skeleton class="h-10 w-full" />
            </div>

            <div class="mt-10 flex flex-col gap-2">
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

            <div class="mt-10 flex flex-col gap-2">
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
import { Skeleton } from "@upmind/ui";
import {
  productConfigRootVariants,
  productConfigContentVariants,
  productConfigWrapperVariants,
  productConfigHeadingVariants
} from "../variants";

// --- components

// --- types
</script>
