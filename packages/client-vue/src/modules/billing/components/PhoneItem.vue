<template>
  <div class="pointer-events-none flex w-full !cursor-pointer">
    <span
      class="border-control flex w-28 items-center justify-center space-x-2 rounded-l-lg border border-r-0 text-sm"
    >
      <Avatar :icon="lowerCase(props.phone.country)" size="3xs" />
      <span class="text-emphasis-medium"
        >+{{ props.phone.countryCallingCode }}</span
      >
    </span>
    <Input
      :model-value="props.phone.nationalNumber"
      type="tel"
      class="border-control !cursor-pointer rounded-l-none focus:outline-none disabled:opacity-100"
      disabled
    />
  </div>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Avatar, Input } from "@upmind-automation/upmind-ui";

// --- utils
import { lowerCase } from "lodash-es";

// --- types
import type { Phone } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<Phone>();
// -----------------------------------------------------------------------------

const { t } = useI18n();
</script>
