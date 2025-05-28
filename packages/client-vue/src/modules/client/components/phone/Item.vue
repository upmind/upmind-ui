<template>
  <div class="flex w-full items-center gap-x-3">
    <Avatar
      v-if="!editing"
      :icon="phone.phone.country?.toLowerCase()"
      class="h-7"
    />
    <div class="flex w-full flex-col gap-y-1">
      <header class="flex w-full items-start justify-between">
        <h3
          class="m-0 flex items-center gap-x-2 text-sm font-semibold leading-none"
        >
          {{ phone.phone.number }}
          <Badge variant="tonal" size="xs">{{ getTypeBadge() }}</Badge>
          <Badge
            v-if="editing && phone.meta.isDefault"
            variant="flat"
            size="xs"
            label="Default"
          />
        </h3>

        <Link
          v-if="editing"
          label="Delete"
          size="xs"
          variant="muted"
          @click.prevent="editAddress"
          tabindex="-1"
          @mousedown.stop.prevent
          class="h-4"
        />
      </header>

      <p v-if="!editing" class="text-emphasis-medium m-0 text-sm leading-none">
        Default phone number
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// --- components
import { Link, Badge, Avatar } from "@upmind-automation/upmind-ui";

// --- types
import type { Phone } from "@upmind-automation/headless-vue";

const props = defineProps<{
  phone: Phone;
  editing?: boolean;
}>();

const getTypeBadge = () => {
  switch (props.phone.type) {
    case 0:
      return "Mobile";
    case 1:
      return "Home";
    case 2:
      return "Office";
    case 3:
      return "Company";
  }
};

const editAddress = () => {
  console.log("editAddress");
};
</script>
