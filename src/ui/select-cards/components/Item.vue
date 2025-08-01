<template>
  <li class="flex w-full list-none justify-between text-md font-medium">
    <span class="flex gap-2">
      {{ label }}
      <Badge v-if="badge" v-bind="badge" />
    </span>
    <span>{{ appendLabel }}</span>
  </li>
</template>

<script setup lang="ts">
import type { SelectCardsItemProps } from "../types";
import { Badge } from "../../badge";

defineProps<SelectCardsItemProps>();
</script>
