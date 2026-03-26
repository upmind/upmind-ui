<template>
  <div :class="cn(styles.input.container, props.class)">
    <slot name="prepend">
      <InputItems :icon="props.icon" :avatar="props.avatar" />
    </slot>
    <slot v-bind="{ modelValue, styles, delegatedProps }">
      <OTPInput
        v-bind="delegatedProps"
        v-model="modelValue"
        :maxlength="props.maxlength"
        :container-class="'contents'"
        data-testid="input-otp"
      >
        <template #default="{ slots, isFocused }">
          <InputOTPGroup>
            <InputOTPSlot
              v-for="(slot, idx) in slice(slots, 0, midpoint)"
              :key="idx"
              v-bind="slot"
              :is-focused="isFocused"
              :size="props.size"
            />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot
              v-for="(slot, idx) in slice(slots, midpoint)"
              :key="idx + midpoint"
              v-bind="slot"
              :is-focused="isFocused"
              :size="props.size"
            />
          </InputOTPGroup>
        </template>
      </OTPInput>
    </slot>

    <slot name="append">
      <InputItems :icon="props.iconAppend" :avatar="props.avatarAppend" />
    </slot>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { OTPInput } from "vue-input-otp";
import { computed } from "vue";

// --- components
import InputOTPGroup from "./InputOTPGroup.vue";
import InputOTPSlot from "./InputOTPSlot.vue";
import InputOTPSeparator from "./InputOTPSeparator.vue";
import InputItems from "../input/InputItems.vue";

// --- internal
import config from "./input-otp.config";

// --- utils
import { cn, useStyles } from "../../utils";
import { ceil, omit, slice } from "lodash-es";

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

const modelValue = defineModel<InputOTPProps["modelValue"]>("modelValue", {});

const midpoint = computed(() => ceil(props.maxlength / 2));

const delegatedProps = computed(
  (): Omit<
    InputOTPProps,
    | "class"
    | "uiConfig"
    | "defaultValue"
    | "modelValue"
    | "width"
    | "size"
    | "icon"
    | "avatar"
    | "iconAppend"
    | "avatarAppend"
    | "autoFocus"
    | "maxlength"
    | "ring"
  > =>
    omit(props, [
      "class",
      "uiConfig",
      "defaultValue",
      "modelValue",
      "width",
      "size",
      "icon",
      "avatar",
      "iconAppend",
      "avatarAppend",
      "autoFocus",
      "maxlength",
      "ring"
    ])
);

const meta = computed(() => ({
  width: props.width,
  align: props.align,
  hasRing: props.ring
}));

const styles = useStyles(["input"], meta, config, props.uiConfig ?? {});
</script>
