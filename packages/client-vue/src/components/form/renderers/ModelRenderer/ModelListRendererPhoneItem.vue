<template>
  <div class="flex w-full !cursor-pointer">
    <span
      class="border-control flex w-28 items-center justify-center space-x-2 rounded-l-lg border border-r-0 text-sm"
    >
      <Avatar :icon="lowerCase(country)" size="3xs" />
      <span class="text-emphasis-medium">+{{ countryCallingCode }}</span>
    </span>
    <Input
      :default-value="nationalNumber"
      type="tel"
      class="border-control !cursor-pointer rounded-l-none focus:outline-none disabled:opacity-100"
      disabled
    />
  </div>
</template>

<script setup lang="ts">
// --- components
import { Avatar, Input } from "@upmind-automation/upmind-ui";

// --- utils
import { lowerCase } from "lodash-es";

// --- types
import type { Phone } from "@upmind-automation/headless";
defineProps<Phone["phone"]>();
</script>
