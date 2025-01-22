<template>
  <UpmCard class="h-full w-full !p-0" disabled>
    <div class="flex h-full flex-col">
      <!-- Image section -->
      <div class="aspect-video shrink-0 overflow-hidden rounded-t-lg">
        <Skeleton class="text-primary h-full w-full pt-2 text-lg font-medium">
          Image
        </Skeleton>
      </div>

      <!-- Content section -->
      <div class="flex flex-1 flex-col justify-between space-y-8 p-6">
        <div
          class="flex flex-1 flex-col justify-between gap-y-8 text-sm font-medium leading-6"
        >
          <!-- Title and description -->
          <div class="flex flex-col gap-x-2">
            <div class="flex flex-col gap-2">
              <Skeleton class="m-0 text-2xl font-semibold"
                >Product Name</Skeleton
              >

              <Skeleton
                class="text-emphasis-disabled m-0 min-h-12 text-sm leading-6"
              >
                Product description
              </Skeleton>
            </div>
          </div>

          <!-- Price section -->
          <div class="not-prose flex flex-col gap-y-2">
            <!-- Price Intro: eg. 'From' or 'Was $X.XX' -->
            <div class="flex items-center space-x-2">
              <Skeleton class="text-emphasis-disabled text-sm">Only</Skeleton>
            </div>

            <div class="flex items-baseline">
              <!-- Current Price -->
              <Skeleton class="text-3xl font-bold"> currentPrice </Skeleton>

              <!-- Term -->
              <template>
                <Skeleton
                  class="text-emphasis-medium ml-1 text-sm leading-none"
                >
                  Monthly
                </Skeleton>
              </template>
            </div>

            <!-- Summary (If there is a billing cycle) -->
            <Skeleton class="text-emphasis-disabled mt-1 text-sm">
              Term Price
            </Skeleton>
          </div>
        </div>

        <!-- Button section -->
        <div>
          <Skeleton color="primary" size="sm" class="rounded-pill h-10 w-full"
            >Button</Skeleton
          >
        </div>
      </div>
    </div>
  </UpmCard>
</template>

<script lang="ts" setup>
import UpmCard from "../content/Card.vue";
import { Skeleton } from "@upmind-automation/upwind";
</script>
