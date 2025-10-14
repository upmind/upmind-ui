<template>
  <footer class="flex flex-col gap-2 md:flex-row md:justify-start">
    <Button
      :label="t('action.save_details')"
      color="primary"
      size="lg"
      :disabled="props.disabled || props.loading"
      :loading="props.processing"
      @click="emits('save')"
      :pill="!props.modal"
    />
    <Button
      v-if="!props.noCancel"
      :label="t('action.cancel')"
      variant="ghost"
      size="lg"
      :disabled="props.loading || props.processing"
      @click="emits('cancel')"
      :pill="!props.modal"
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
  disabled?: boolean;
  modal?: boolean;
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
