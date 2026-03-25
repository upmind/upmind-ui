<template>
  <div
    :class="cn(
      'bg-control-surface shadow-control-default control-radius relative flex h-10 w-10 items-center justify-center text-base transition-all',
      { 'z-10 outline-2 outline-offset-2 outline-(--color-control-ring)': isActive && isFocused },
      $attrs.class ?? ''
    )"
    data-testid="input-otp-slot"
  >
    <template v-if="char">
      <span>{{ char }}</span>
    </template>
    <template v-else-if="isActive && isFocused">
      <div class="animate-caret-blink bg-default pointer-events-none absolute inset-y-[25%] left-1/2 w-px duration-1000" />
    </template>
  </div>
</template>

<script lang="ts" setup>
// --- types
import type { InputOTPSlotProps } from "./types";

// --- utils
import { cn } from "../../utils";

// -----------------------------------------------------------------------------

defineProps<InputOTPSlotProps>();
</script>
