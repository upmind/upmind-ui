<template>
  <div :class="cn(styles.input.container, props.class)">
    <slot name="prepend">
      <InputItems :icon="props.icon" :avatar="props.avatar" />
    </slot>

    <input
      ref="input"
      v-bind="delegatedProps"
      v-model="modelValue"
      :class="styles.input.field"
      :data-testid="`input-${kebabCase(props.id || props.type)}`"
    />

    <slot name="append">
      <InputItems :icon="props.iconAppend" :avatar="props.avatarAppend" />
    </slot>
  </div>
</template>

<script lang="ts" setup>
// --- external
import IMask, { type InputElement } from "imask";
import { useTemplateRef, computed, onMounted } from "vue";
// --- internal
import config from "./input.config";
// --- components
import InputItems from "./InputItems.vue";
import { useStyles, cn } from "../../utils";
import { kebabCase } from "lodash-es";
// --- utils
import { omit } from "lodash-es";
// --- types
import type { InputProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InputProps>(), {
  width: "full",
  ring: true,
  // ---
  uiConfig: () => ({ input: [] }),
  class: ""
});

const _emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const input = useTemplateRef<InputElement>("input");
const modelValue = defineModel<InputProps["modelValue"]>("modelValue", {});

const delegatedProps = computed(
  (): Omit<
    InputProps,
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
      "autoFocus"
    ])
);

const meta = computed(() => ({
  width: props.width,
  hasRing: props.ring
}));

const styles = useStyles(
  ["container", "input"],
  meta,
  config,
  props.uiConfig ?? {}
);

onMounted(() => {
  applyMask();
});

function applyMask() {
  if (props.mask && input.value) {
    // if we have a mask then we use the IMask library to apply it and then keep our model and maskedValue in sync
    const maskOptions = {
      mask: props.mask as any // Cast to 'any' to accommodate both string and RegExp types
      // lazy: false // Don't hide the mask when empty
    };

    const masked = IMask(input.value, maskOptions);

    masked.on("accept", () => {
      modelValue.value = masked.value;
    });
  }
}
</script>
