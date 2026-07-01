<template>
  <footer class="flex flex-col gap-2 md:flex-row md:justify-start">
    <Button
      :label="t('action.save_details')"
      color="primary"
      size="lg"
      :disabled="props.disabled || props.loading"
      :loading="props.processing"
      @click="emits('save')"
    />
    <Button
      :label="t('text.cancel')"
      color="primary"
      variant="ghost"
      size="lg"
      :disabled="props.loading"
      :loading="props.processing"
      @click="emits('cancel')"
    />
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Button } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = defineProps<{
  type: "address" | "company" | "phone" | "email";
  disabled?: boolean;
  processing?: boolean;
  loading?: boolean;
}>();

const emits = defineEmits<{
  save: [];
  cancel: [];
}>();
// -----------------------------------------------------------------------------
const { t } = useI18n();
</script>
