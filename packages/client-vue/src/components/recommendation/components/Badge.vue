<template>
  <Badge
    v-if="badge"
    :label="badge"
    variant="flat"
    size="lg"
    class="absolute left-4 -translate-y-1/2 !text-sm ring-1 ring-white"
  />
</template>

<script lang="ts" setup>
import { Badge } from "@upmind-automation/upwind";

defineProps<{
  badge?: string;
}>();
</script>
