<template>
  <div class="flex items-center space-x-2">
    <span
      class="border-control-default text-md-tight flex items-center justify-center space-x-2"
    >
      <Avatar :icon="lowerCase(props.phone?.country ?? '')" size="xs" />

      <span class="text-muted">+{{ props.phone?.countryCallingCode }}</span>
    </span>
    <p class="text-md">{{ props.phone?.nationalNumber }}</p>
  </div>
</template>

<script setup lang="ts">
import { Avatar } from "@upmind-automation/upmind-ui";
import { lowerCase } from "lodash-es";
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

const _doEdit = () => {
  if (!props?.id) return;
  emits("edit", props.id);
};
</script>
