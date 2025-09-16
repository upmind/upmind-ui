<template>
  <div class="mt-4 flex flex-col gap-3">
    <div class="flex justify-between gap-2">
      <Skeleton class="h-5 w-24" />
      <Skeleton class="h-5 w-32" />
    </div>

    <div class="flex justify-between gap-2">
      <Skeleton class="h-5 w-32" />
      <Skeleton class="h-5 w-44" />
    </div>

    <div class="flex justify-between gap-2">
      <Skeleton class="h-5 w-24" />
      <Skeleton class="h-5 w-28" />
    </div>

    <div class="mt-2 flex items-end justify-between gap-2">
      <Skeleton class="h-8 w-20" />
      <Skeleton class="h-10 w-40" />
    </div>

    <Skeleton class="mt-6 h-12 w-full rounded-full" />
  </div>
</template>

<script setup lang="ts">
import { Skeleton } from "@upmind-automation/upmind-ui";
</script>
