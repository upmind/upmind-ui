<template>
  <span
    class="border-control flex h-10 w-24 items-center justify-center space-x-2 border-r text-sm"
  >
    <Avatar :icon="lowerCase(props.phone?.country)" size="3xs" />
    <span class="text-emphasis-medium"
      >+{{ props.phone?.countryCallingCode }}</span
    >
  </span>
  <InputExtended
    :model-value="props.phone?.nationalNumber"
    type="tel"
    class="border-none"
    disabled
  />
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Avatar, InputExtended } from "@upmind-automation/upmind-ui";

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
