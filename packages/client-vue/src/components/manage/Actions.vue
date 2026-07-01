<template>
  <footer class="flex w-full flex-col gap-2 md:flex-row md:justify-start">
    <Button
      data-testid="button-manage-save"
      :label="t('action.save_details')"
      :block="props.noCancel"
      color="primary"
      size="lg"
      :disabled="props.disabled || props.loading"
      :loading="props.processing"
      @click="emits('save')"
      class="block md:inline-block"
    />
    <Button
      v-if="!props.noCancel"
      data-testid="button-manage-cancel"
      :label="t('action.cancel')"
      variant="ghost"
      size="lg"
      :disabled="props.loading || props.processing"
      @click="emits('cancel')"
    />
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
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
