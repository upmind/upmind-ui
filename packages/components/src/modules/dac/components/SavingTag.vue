<template>
  <I18n
    v-if="!!percentage"
    path="save_x_percent"
    class="bg-primary/10 text-primary border-primary text-tiny shrink-0 rounded-md border px-1.5 py-0.5 text-center font-medium uppercase"
    :values="{ percentage }"
  />
</template>

<script setup lang="ts">
import { useI18n } from "@src/composables/i18n";
const { I18n } = useI18n();

withDefaults(defineProps<{ percentage?: number }>(), { percentage: 0 });
</script>
