<template>
  <div class="flex items-center space-x-2">
    <span
      class="border-control flex items-center justify-center space-x-2 text-base"
    >
      <Avatar size="xs">
        <template #fallback>
          <Icon :icon="lowerCase(props.phone?.country ?? '')" />
        </template>
      </Avatar>

      <span class="text-muted">+{{ props.phone?.countryCallingCode }}</span>
    </span>
    <p class="text-base">{{ props.phone?.nationalNumber }}</p>
  </div>
</template>

<script setup lang="ts">
import { Avatar } from "@upmind/ui";
import { Icon } from "../../../components/icon";
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
