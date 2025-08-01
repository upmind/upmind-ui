<template>
  <li class="list-none">
    {{ label }}
  </li>
</template>

<script setup lang="ts">
import type { SelectCardsItemProps } from "../types";

const props = defineProps<SelectCardsItemProps>();
</script>
