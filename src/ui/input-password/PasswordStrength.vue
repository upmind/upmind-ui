<template>
  <div :class="cn(styles.passwordStrength.root, props.class)">
    <div
      v-if="props.showBars && props.max > 0"
      :class="styles.passwordStrength.bars"
    >
      <div v-for="i in props.max" :key="i" :class="barClass(i)" />
    </div>
    <p
      v-if="props.message"
      :id="props.messageId"
      :class="styles.passwordStrength.message"
      role="status"
      aria-live="polite"
    >
      {{ props.message }}
    </p>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
// --- internal
import config, { barVariants } from "./input-password.config";
// --- utils
import { cn, useStyles } from "../../utils";
// --- types
import type { PasswordStrengthProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<PasswordStrengthProps>(), {
  showBars: false,
  score: 0,
  max: 0,
  message: "",
  hasError: false,
  // --- styles
  uiConfig: () => ({ passwordStrength: [] }),
  class: ""
});

const tier = computed<"weak" | "medium" | "strong">(() => {
  const ratio = props.max > 0 ? props.score / props.max : 0;
  if (ratio >= 1) return "strong";
  if (ratio >= 0.5) return "medium";
  return "weak";
});

function barClass(index: number) {
  return barVariants({
    state: index <= props.score ? tier.value : "empty"
  });
}

const meta = computed(() => ({
  hasError: props.hasError
}));
const styles = useStyles(
  ["passwordStrength"],
  meta,
  config,
  props.uiConfig ?? {}
);
</script>
