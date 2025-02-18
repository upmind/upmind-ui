<template>
  <Card class="relative flex flex-col gap-y-3 p-6 md:gap-y-4 md:p-8">
    <!-- Main Product Summary Section -->
    <div class="flex flex-col md:gap-y-1">
      <!-- Product Header with Image and Main Info -->
      <div class="flex items-center justify-between">
        <div class="flex w-full items-center gap-x-3">
          <!-- Product Image Placeholder -->
          <Skeleton class="m-0 h-12 w-12" />

          <div class="flex w-full flex-col gap-y-1">
            <!-- Category and Desktop Promotion Row -->
            <div class="flex items-end justify-between">
              <Skeleton class="h-5 w-32 text-sm" />
              <!-- Category -->
            </div>

            <!-- Product Name and Price Row -->
            <div class="flex items-end justify-between">
              <Skeleton class="h-6 w-48 text-xl" />
              <!-- Product Name -->
              <div class="hidden items-center gap-x-6 md:flex">
                <Skeleton class="h-6 w-32 text-lg" />
                <!-- Price -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile-only Price and Quantity Section -->
      <div class="mt-1 flex flex-col gap-y-1 md:hidden">
        <Skeleton class="h-5 w-48 text-sm" />
        <!-- Terms Description -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-x-2">
            <Skeleton class="h-6 w-32 text-lg" />
            <!-- Current Price -->
          </div>
        </div>
      </div>

      <!-- Desktop-only Terms and Regular Price -->
      <div class="mt-1 hidden justify-between md:flex">
        <Skeleton class="h-6 w-48 text-sm" />
        <!-- Terms Description -->
      </div>

      <slot />
    </div>

    <!-- Actions Section -->
    <div class="flex items-baseline justify-between pt-0.5 md:mt-2.5 md:pt-0">
      <Skeleton class="w-32" />
      <!-- Show Details Button -->
      <div class="flex items-end space-x-2">
        <Skeleton class="h-7 w-7" />
        <!-- Edit Button -->
        <Skeleton class="h-7 w-7" />
        <!-- Delete Button -->
      </div>
    </div>
  </Card>
</template>

<script lang="ts" setup>
import Card from "../../../../components/content/Card.vue";
import { Skeleton } from "@upmind-automation/upmind-ui";
</script>
