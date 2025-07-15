<template>
  <div class="flex items-center space-x-2 py-0.5">
    <span
      class="border-control flex items-center justify-center space-x-2 text-sm"
    >
      <Avatar :icon="lowerCase(props.phone?.country ?? '')" size="3xs" />

      <span class="text-emphasis-medium"
        >+{{ props.phone?.countryCallingCode }}</span
      >
    </span>
    <p class="text-sm">{{ props.phone?.nationalNumber }}</p>
  </div>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Avatar } from "@upmind-automation/upmind-ui";

// --- utils
import { lowerCase } from "lodash-es";

// --- types
import type { Phone } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<
  Phone & {
    readonly?: boolean;
  }
>();

const emits = defineEmits<{
  (e: "edit", id: string): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const doEdit = () => {
  if (!props?.id) return;
  emits("edit", props.id);
};
</script>
