<template>
  <UpmLayout :layout="LAYOUT_VARIANTS.FULL">
    <template #controls>
      <RouterLink
        :to="{ name: 'client-area.slots' }"
        active-class="font-bold underline pointer-events-none"
      >
        Slots
      </RouterLink>
    </template>

    <UpmRouteView />
  </UpmLayout>
</template>

<script setup lang="ts">
import {
  LAYOUT_VARIANTS,
  UpmLayout,
  UpmRouteView
} from "@upmind-automation/client-vue";
</script>
