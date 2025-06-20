<template>
  <section class="flex flex-col gap-y-6">
    <div>
      <Skeleton class="h-5 w-20" />
      <Skeleton class="mt-2 h-10 w-full" />
    </div>

    <div class="flex w-full flex-col gap-y-4 md:flex-row md:gap-x-4">
      <span class="w-full md:w-1/2">
        <Skeleton class="h-5 w-28" />
        <Skeleton class="mt-2 h-10 w-full" />
      </span>
      <span class="w-full md:w-1/2">
        <Skeleton class="h-5 w-36" />
        <Skeleton class="mt-2 h-10 w-full" />
      </span>
    </div>

    <div>
      <Skeleton class="h-5 w-56" />
      <Skeleton class="mt-2 h-20 w-full" />
    </div>

    <div class="hidden md:block">
      <Skeleton class="h-5 w-44" />
      <Skeleton class="mt-2 h-10 w-full" />
    </div>

    <ModelRendererActions disabled loading />
  </section>
</template>

<script setup lang="ts">
import { Skeleton } from "@upmind-automation/upmind-ui";
import ModelRendererActions from "./Actions.vue";
</script>
