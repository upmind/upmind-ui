<template>
  <div class="flex w-full flex-col gap-y-1">
    <header class="flex w-full items-start justify-between">
      <h3 class="m-0 flex items-center gap-x-2 text-sm font-semibold">
        {{ title }}
        <Badge v-if="isSelected" variant="flat" size="xs" label="Default" />
      </h3>

      <Link
        v-if="allowEdit"
        label="Edit"
        size="xs"
        variant="muted"
        tabindex="-1"
        @mousedown.stop.prevent
        class="h-4"
        @click.stop.prevent="edit"
      />
    </header>

    <p class="text-emphasis-high m-0 text-sm">
      {{ description }}
    </p>

    <p v-if="regNumber || vatNumber" class="text-emphasis-medium m-0 text-sm">
      Company <template v-if="regNumber"> {{ regNumber }}</template>
      <template v-if="vatNumber"> {{ vatNumber }}</template>
    </p>
  </div>
</template>

<script setup lang="ts">
// --- components
import { Link, Badge } from "@upmind-automation/upmind-ui";

const props = defineProps<{
  id: string;
  title: string;
  description: string;
  regNumber: string;
  vatNumber: string;
  isSelected: boolean;
  allowEdit: boolean;
}>();

const emit = defineEmits<{
  (e: "edit", id: string): void;
}>();

const edit = () => {
  emit("edit", props.id);
};
</script>
