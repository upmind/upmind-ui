<template>
  <footer class="flex flex-col gap-2 md:flex-row md:justify-start">
    <Button
      :label="t(`${i18nKey ?? 'manage'}.actions.resolve`)"
      color="secondary"
      :disabled="props.disabled || props.loading"
      :loading="props.processing"
      @click="emits('save')"
    />
    <Button
      v-if="!props.noCancel"
      :label="t(`${i18nKey ?? 'manage'}.actions.reject`)"
      color="secondary"
      variant="ghost"
      :disabled="props.loading"
      :loading="props.processing"
      @click="emits('cancel')"
    />
  </footer>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Button } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{
  i18nKey?: string;
  disabled?: boolean;
  processing?: boolean;
  loading?: boolean;
  noCancel?: boolean; // if true, the cancel button will not be displayed
}>();

const emits = defineEmits<{
  save: [];
  cancel: [];
}>();
// -----------------------------------------------------------------------------
const { t } = useI18n();
</script>
