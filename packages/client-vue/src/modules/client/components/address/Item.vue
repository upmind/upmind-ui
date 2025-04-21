<template>
  <div class="flex flex-col gap-y-1">
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
    <p class="text-emphasis-medium m-0 text-sm leading-none">
      {{ address.description }}
    </p>

    <footer
      v-if="editing"
      class="flex items-center gap-x-2"
      tabindex="-1"
      @mousedown.stop.prevent
    >
      <Link
        :label="getEditLabel()"
        size="xs"
        variant="muted"
        @click.prevent="editAddress"
      />
    </footer>
  </div>
</template>

<script setup lang="ts">
// --- components
import { Link, Badge } from "@upmind-automation/upmind-ui";

// --- types
import type { Address } from "@upmind-automation/headless-vue";

const props = defineProps<{
  address: Address;
  editing: boolean;
}>();

const getTypeBadge = () => {
  switch (props.address.type) {
    case 1:
      return "Address";
    case 2:
      return "Company";
  }
};

const getEditLabel = () => {
  switch (props.address.type) {
    case 1:
      return "Edit address";
    case 2:
      return "Edit company details";
  }
};

const editAddress = () => {
  console.log("editAddress");
};
</script>
