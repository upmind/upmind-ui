<template>
  <div
    :class="cn(containerStyles, props.class)"
    :aria-invalid="props.ariaInvalid"
  >
    <slot name="prepend">
      <InputItems :icon="props.icon" :avatar="props.avatar" />
    </slot>

    <!-- First half -->
    <div :class="groupClass">
      <input
        v-for="idx in midpoint"
        :key="idx - 1"
        ref="inputRefs"
        :value="chars[idx - 1] ?? ''"
        :readonly="props.disabled"
        :aria-invalid="effectiveInvalid"
        :class="slotClass(idx - 1)"
        type="text"
        pattern="\d*"
        inputmode="numeric"
        autocomplete="off"
        data-testid="input-otp-slot"
        @input="onChange(idx - 1, ($event.target as HTMLInputElement).value)"
        @focus="onSlotFocus(idx - 1)"
        @keydown.delete="onDelete(idx - 1)"
        @keydown.left="setFocusedIndex(idx - 2)"
        @keydown.right="setFocusedIndex(idx)"
        @keydown.up.prevent="onCycleDigit(idx - 1, 1)"
        @keydown.down.prevent="onCycleDigit(idx - 1, -1)"
        @paste.prevent="onPaste($event)"
      />
    </div>

    <!-- Separator -->
    <div role="separator">
      <span class="text-muted">—</span>
    </div>

    <!-- Second half -->
    <div :class="groupClass">
      <input
        v-for="idx in (props.maxlength - midpoint)"
        :key="idx - 1 + midpoint"
        ref="inputRefs"
        :value="chars[idx - 1 + midpoint] ?? ''"
        :readonly="props.disabled"
        :aria-invalid="effectiveInvalid"
        :class="slotClass(idx - 1 + midpoint)"
        type="text"
        pattern="\d*"
        inputmode="numeric"
        autocomplete="off"
        data-testid="input-otp-slot"
        @input="onChange(idx - 1 + midpoint, ($event.target as HTMLInputElement).value)"
        @focus="onSlotFocus(idx - 1 + midpoint)"
        @keydown.delete="onDelete(idx - 1 + midpoint)"
        @keydown.left="setFocusedIndex(idx - 2 + midpoint)"
        @keydown.right="setFocusedIndex(idx + midpoint)"
        @keydown.up.prevent="onCycleDigit(idx - 1 + midpoint, 1)"
        @keydown.down.prevent="onCycleDigit(idx - 1 + midpoint, -1)"
        @paste.prevent="onPaste($event)"
      />
    </div>

    <slot name="append">
      <InputItems :icon="props.iconAppend" :avatar="props.avatarAppend" />
    </slot>
  </div>
</template>

<script lang="ts" setup>
// --- external
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch
} from "vue";

// --- components
import InputItems from "../input/InputItems.vue";

// --- internal
import config from "./input-otp.config";

// --- utils
import { cn, useStyles } from "../../utils";
import { ceil } from "lodash-es";

// --- types
import type { InputOTPProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InputOTPProps>(), {
  disabled: false,
  inputmode: "numeric",
  maxlength: 6,
  textAlign: "center",
  width: "full",
  align: "left",
  ring: true,
  // ---
  uiConfig: () => ({ input: [] }),
  class: ""
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const modelValue = defineModel<InputOTPProps["modelValue"]>("modelValue", {});

// --- state

const chars = ref<string[]>([]);
const focusedIndex = ref(-1);
const isFocused = ref(false);
const inputRefs = ref<HTMLInputElement[]>([]);

const midpoint = computed(() => ceil(props.maxlength / 2));

const currentValue = computed(() => chars.value.join(""));

// --- styles

const containerMeta = computed(() => ({
  width: props.width,
  align: props.align,
  hasRing: props.ring
}));

const styles = useStyles(["input"], containerMeta, config, props.uiConfig ?? {});
const containerStyles = computed(() => styles.value.input.container);

function slotClass(index: number) {
  return config.input.slot({
    size: (props.size as any) ?? "md",
    hasRing: props.ring ?? true,
    isFocused: isFocused.value && focusedIndex.value === index
  });
}

const isComplete = computed(() => chars.value.every(c => c !== ""));
const effectiveInvalid = computed(() => isComplete.value && !!props.ariaInvalid);
const groupClass = computed(() =>
  cn("flex items-center", effectiveInvalid.value ? "gap-4" : "gap-3")
);

// --- methods

function init() {
  const initial = modelValue.value ?? "";
  chars.value = [];
  for (let i = 0; i < props.maxlength; i++) {
    chars.value.push(initial[i] ?? "");
  }
}

function setFocusedIndex(index: number) {
  if (index < 0 || index >= props.maxlength) return;
  focusedIndex.value = index;
  isFocused.value = true;
  nextTick(() => {
    inputRefs.value[index]?.focus();
  });
}

function onSlotFocus(index: number) {
  focusedIndex.value = index;
  isFocused.value = true;
  nextTick(() => inputRefs.value[index]?.select());
}

function emitValue() {
  const value = currentValue.value;
  const isComplete = chars.value.every(c => c !== "");
  modelValue.value = isComplete ? value : value;
  emit("update:modelValue", isComplete ? value : "");
}

function onChange(index: number, value: string) {
  if (props.disabled) return;

  // Multi-char input: could be autofill or overwrite of selected text
  if (value.length > 1) {
    // If all digits and length matches maxlength, treat as autofill
    const digits = value.replace(/\D/g, "");
    if (digits.length >= props.maxlength) {
      autofill(digits);
      return;
    }
    // Otherwise take the last digit (user typed over selected char)
    const lastDigit = digits.slice(-1);
    if (lastDigit) {
      chars.value[index] = lastDigit;
      setFocusedIndex(index + 1);
      emitValue();
      // Sync the input element value
      nextTick(() => {
        if (inputRefs.value[index]) {
          inputRefs.value[index].value = lastDigit;
        }
      });
    }
    return;
  }

  // Validate digit only
  if (value && !/^\d$/.test(value)) {
    // Reset input to current char
    nextTick(() => {
      if (inputRefs.value[index]) {
        inputRefs.value[index].value = chars.value[index] ?? "";
      }
    });
    return;
  }

  chars.value[index] = value;
  if (value) {
    setFocusedIndex(focusedIndex.value + 1);
  }
  emitValue();
}

function onDelete(index: number) {
  if (props.disabled) return;
  if (chars.value[index]) {
    chars.value[index] = "";
    emitValue();
  } else if (index > 0) {
    chars.value[index - 1] = "";
    setFocusedIndex(index - 1);
    emitValue();
  }
}

function onCycleDigit(index: number, direction: number) {
  if (props.disabled) return;
  const current = chars.value[index];
  const digit = current ? parseInt(current, 10) : (direction > 0 ? -1 : 10);
  const next = ((digit + direction + 10) % 10).toString();
  chars.value[index] = next;
  nextTick(() => {
    if (inputRefs.value[index]) {
      inputRefs.value[index].value = next;
    }
  });
  emitValue();
}

function onPaste(event: ClipboardEvent) {
  if (props.disabled) return;
  const text = event.clipboardData?.getData("text") ?? "";
  autofill(text);
}

function autofill(text: string) {
  const digits = text.replace(/\D/g, "").split("").slice(0, props.maxlength);

  let lastIndex = 0;
  for (let i = 0; i < props.maxlength; i++) {
    chars.value[i] = digits[i] ?? "";
    if (digits[i]) lastIndex = i;
  }

  emitValue();
  nextTick(() => {
    // Sync all input elements
    for (let i = 0; i < props.maxlength; i++) {
      if (inputRefs.value[i]) {
        inputRefs.value[i].value = chars.value[i];
      }
    }
    setFocusedIndex(Math.min(lastIndex + 1, props.maxlength - 1));
  });
}

// --- lifecycle

onMounted(() => {
  init();
  if (props.autoFocus) {
    nextTick(() => setFocusedIndex(0));
  }
});

watch(
  () => modelValue.value,
  (newVal) => {
    if (newVal && newVal.length === props.maxlength && newVal !== currentValue.value) {
      init();
    }
  }
);
</script>
