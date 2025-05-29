<template>
  <div class="flex w-full flex-col gap-y-1 rounded-lg border p-5 px-6">
    <header class="flex w-full items-start justify-between">
      <h3
        class="m-0 flex items-center gap-x-1 text-sm font-semibold leading-none"
      >
        {{ address.title }}
        <Badge variant="tonal" size="xs">{{ getTypeBadge() }}</Badge>
        <Badge
          v-if="editing && address.meta.isDefault"
          variant="flat"
          size="xs"
          label="Default"
        />
      </h3>

      <Link
        label="Change"
        size="xs"
        variant="muted"
        @click.prevent="editAddress"
        tabindex="-1"
        @mousedown.stop.prevent
        class="h-4"
      />
    </header>

    <p class="text-emphasis-medium m-0 text-sm leading-none">
      {{ address.description }}
    </p>
  </div>
</template>

<script setup lang="ts">
// --- components
import { Link, Badge } from "@upmind-automation/upmind-ui";

// --- types
import type { Address } from "@upmind-automation/headless-vue";

const props = defineProps<{
  address: Address;
  editing?: boolean;
}>();

const getTypeBadge = () => {
  switch (props.address.type) {
    case 1:
      return "Personal";
    case 4:
      return "Business";
  }
};

const editAddress = () => {
  console.log("editAddress");
};
</script>
