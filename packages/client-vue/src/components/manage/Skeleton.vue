<template>
  <section class="flex flex-col gap-y-6">
    <div>
      <Skeleton class="h-5 w-20" />
      <Skeleton class="mt-2 h-10 w-full" />
    </div>

    <div>
      <Skeleton class="h-5 w-20" />
      <Skeleton class="mt-2 h-10 w-full" />
    </div>

    <Actions v-if="modal" :i18nKey="i18nKey" disabled loading type="address" />
  </section>
</template>

<script setup lang="ts">
import { Skeleton } from "@upmind-automation/upmind-ui";
import Actions from "./Actions.vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  i18nKey?: string;
  modal?: boolean;
}>();
</script>
