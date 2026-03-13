<template>
  <Card
    as="li"
    class="shadow-control-default card-radius relative flex list-none flex-col gap-y-3 px-8 py-5 text-base"
    padding="md"
  >
    <div class="flex flex-col divide-y divide-dashed [&>*]:py-4">
      <article class="flex flex-col gap-2 lg:gap-4">
        <!-- Header: Image, Category, Name -->
        <header class="flex gap-3">
          <!-- Product Image -->
          <Skeleton class="m-0 h-12 max-w-12 min-w-12" />

          <div class="w-full">
            <!-- Category Row with Delete Action -->
            <div class="flex justify-between">
              <div class="flex items-center gap-2">
                <Skeleton class="h-5 w-24" />
              </div>
              <Skeleton class="h-6 w-6" />
            </div>

            <!-- Product Name Row -->
            <div class="flex items-center gap-2">
              <Skeleton class="h-7 w-48" />
            </div>
          </div>
        </header>

        <!-- Footer: Terms, Quantity, Price -->
        <footer class="flex flex-col justify-between gap-2 lg:flex-row">
          <div class="flex flex-col gap-1">
            <Skeleton class="h-5 w-40" />
            <Skeleton class="h-5 w-32" />
          </div>

          <div class="flex items-end justify-between gap-4 lg:justify-end">
            <!-- Quantity -->
            <Skeleton class="h-5 w-16" />
            <!-- Price -->
            <Skeleton class="h-7 w-24" />
          </div>
        </footer>
      </article>
    </div>

    <slot />
  </Card>
</template>

<script lang="ts" setup>
import { Card, Skeleton } from "@upmind-automation/upmind-ui";
</script>
