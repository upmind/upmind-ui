<template>
  <span
    :class="cn(styles.input.slot, ($attrs.class as string) ?? '')"
    data-testid="input-otp-slot"
  >
    <template v-if="char">
      <span>{{ char }}</span>
    </template>
    <template v-else-if="isActive && isFocused">
      <span :class="styles.input.caret" />
    </template>
  </span>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import config from "./input-otp.config";

// --- utils
import { cn, useStyles } from "../../utils";

// --- types
import type { InputOTPSlotProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<InputOTPSlotProps>();

const meta = computed(() => ({
  size: props.size,
  hasRing: true,
  isFocused: !!(props.isActive && props.isFocused)
}));

const styles = useStyles(["input"], meta, config);
</script>
