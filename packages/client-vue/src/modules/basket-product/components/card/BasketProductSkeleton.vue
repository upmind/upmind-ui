<template>
  <Card as="li" class="relative flex list-none flex-col p-0 text-base lg:p-0">
    <div
      class="divide-border-control-default flex flex-col divide-y divide-dashed p-6 *:py-4 *:first:pt-0 *:last:pb-0 lg:px-8 lg:py-9"
    >
      <article class="flex flex-col gap-4">
        <!-- Header: Image, Category/ExPrice, Name/CurrentPrice -->
        <header class="flex items-start gap-3">
          <!-- Product Image -->
          <Skeleton class="image-radius m-0 h-12 w-12 shrink-0" />

          <div class="flex w-full flex-col gap-1">
            <!-- Top row: Category + Ex price -->
            <div class="flex justify-between">
              <div class="flex items-center gap-2">
                <Skeleton class="h-5 w-24" />
              </div>
            </div>

            <!-- Title row: Name + Current price -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <Skeleton class="h-6 w-48" />
              </div>
              <Skeleton class="h-6 w-24 shrink-0" />
            </div>
          </div>
        </header>

        <!-- Footer: Controls (quantity + term) + Renew description -->
        <footer class="flex flex-col justify-between gap-2 lg:flex-row">
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div class="flex items-center gap-2">
              <Skeleton class="h-10 w-12" />
            </div>
            <Skeleton class="h-5 w-28" />
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
