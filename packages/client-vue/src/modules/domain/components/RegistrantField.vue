<template>
  <div class="flex flex-col gap-0.5">
    <span class="text-fg-quaternary text-xs">
      {{ label }}
      <span v-if="required && !value" class="text-utility-error-500">*</span>
    </span>
    <span
      :class="[
        'text-sm',
        value ? 'text-fg-primary' : 'text-utility-error-500 italic'
      ]"
    >
      {{ value || t("domain.missing_field") }}
    </span>
  </div>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// -----------------------------------------------------------------------------

defineProps<{
  label: string;
  value?: string;
  required?: boolean;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
</script>
