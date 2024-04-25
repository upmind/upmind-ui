<template>
  <upw-input
    :id="id"
    :label="label"
    :description="description"
    :errors="errors"
    :size="size"
    :append-avatar="appendAvatar"
    :append-icon="appendIcon"
    :append-text="appendText"
    :prepend-avatar="prependAvatar"
    :prepend-icon="prependIcon"
    :prepend-text="prependText"
    :feedback-icon="feedbackIcon"
    :dirty="meta.isDirty"
    :disabled="meta.isDisabled"
    :visible="meta.isVisible"
    :required="meta.isRequired"
    :focused="meta.isFocused"
    layout="inline"
    variant="flat"
  >
    <span :class="styles.radio.root">
      <input
        :id="id"
        v-bind="safeAttrs"
        type="radio"
        :disabled="disabled"
        :checked="modelValue"
        :class="styles.radio.input"
        @blur="onBlur"
        @input="onChange"
        @focus="onFocus"
        :aria-invalid="meta.isInvalid"
      />
      <upw-icon
        :class="styles.radio.icon"
        :icon="computedIcon"
        v-if="computedIcon"
      />
    </span>
  </upw-input>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed, ref } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwInput from "../input/Input.vue";
import UpwIcon from "../icon/Icon.vue";

// --- utils
import { useStyles } from "../../utils";
import { isNil, isEmpty, omit } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { InputProps } from "../input/types";
import type { RadioProps } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwRadio",
  inheritAttrs: false,
  emits: ["update:modelValue", "focus", "blur"],
  components: {
    UpwInput,
    UpwIcon,
  },

  props: {
    id: {
      type: String,
      default: () => "radio-" + Math.random().toString(36).substr(2, 9),
    },
    label: { type: String },
    description: { type: String },
    errors: { type: String },
    // ---
    size: { type: String as PropType<InputProps["size"]>, default: null },
    // ---
    appendAvatar: { type: [Object, String] as PropType<IconProps["icon"]> },
    appendIcon: { type: [Object, String] as PropType<IconProps["icon"]> },
    appendText: { type: String },
    // ---
    prependAvatar: { type: [Object, String] as PropType<IconProps["icon"]> },
    prependIcon: { type: [Object, String] as PropType<IconProps["icon"]> },
    prependText: { type: String },
    // ---
    feedbackIcon: {
      type: [Object, String] as PropType<IconProps["icon"]>,
      default: "information-circle",
    },
    checkedIcon: {
      type: [String, Object] as PropType<RadioProps["checkedIcon"]>,
      default: "dot",
    },
    uncheckedIcon: {
      type: [String, Object] as PropType<RadioProps["uncheckedIcon"]>,
      default: null,
    },

    // ---
    modelValue: { type: Boolean },
    // ---
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    forceFocus: { type: Boolean },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Array, Object], default: null },
  },

  setup(props, { emit }) {
    const focused = ref(false);

    const meta = computed(() => ({
      size: props.size,
      // ---
      isFocused: props.forceFocus || focused.value,
      isDisabled: props.disabled,
      isVisible: props.visible,
      isRequired: props.required,
      isDirty: !isNil(props.modelValue),
      isChecked: !!props.modelValue,
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.modelValue),
    }));

    const styles = useStyles("radio", meta, config, props.upwindConfig);

    return {
      meta,
      styles,
      onFocus: event => {
        focused.value = true;
        emit("focus", event);
      },
      onBlur: event => {
        focused.value = false;
        emit("blur", event);
      },
      onChange: event => {
        debugger;
        emit("update:modelValue", event.target.value);
      },
    };
  },
  computed: {
    safeAttrs() {
      // TODO: maybe whitelist input attributes
      return omit(this.$attrs, ["layout", "variant"]);
    },
    computedIcon() {
      return this.meta.isChecked ? this.checkedIcon : this.uncheckedIcon;
    },
  },
});
</script>
