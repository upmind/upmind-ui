<template>
  <footer class="flex flex-col gap-2 md:flex-row md:justify-start">
    <Button
      variant="primary"
      size="lg"
      :disabled="props.disabled || props.loading"
      :loading="props.processing"
      @click="emits('save')"
    >
      {{ t("action.save_details") }}
    </Button>
    <Button
      variant="ghost"
      size="lg"
      :disabled="props.loading"
      :loading="props.processing"
      @click="emits('cancel')"
    >
      {{ t("text.cancel") }}
    </Button>
  </footer>
</template>

<script setup lang="ts">
import { Button } from "@upmind/ui";
import { useI18n } from "vue-i18n";

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
