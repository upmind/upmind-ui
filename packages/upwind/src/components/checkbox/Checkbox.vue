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
    <span :class="styles.checkbox.root">
      <input
        :id="id"
        v-bind="safeAttrs"
        type="checkbox"
        :disabled="disabled"
        :checked="modelValue"
        :class="styles.checkbox.input"
        @blur="onBlur"
        @input="onChange"
        @focus="onFocus"
        :aria-invalid="meta.isInvalid"
      />
      <upw-icon
        :class="styles.checkbox.icon"
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
import type { InputProps, IconProps } from "../input/types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwCheckbox",
  inheritAttrs: false,
  emits: ["update:modelValue", "focus", "blur"],
  components: {
    UpwInput,
    UpwIcon,
  },

  props: {
    id: {
      type: String,
      default: () => "checkbox-" + Math.random().toString(36).substr(2, 9),
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
      type: [String, Object] as PropType<IconProps["icon"]>,
      default: "check",
    },
    uncheckedIcon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      default: null,
    },
    indeterminateIcon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      default: "subtract",
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
      isIndeterminate: isNil(props.modelValue),
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.modelValue),
    }));

    const styles = useStyles("checkbox", meta, config, props.upwindConfig);

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
        emit("update:modelValue", event.target.checked);
      },
    };
  },
  computed: {
    safeAttrs() {
      // TODO: maybe whitelist input attributes
      return omit(this.$attrs, ["layout", "variant"]);
    },
    computedIcon() {
      return this.meta.isIndeterminate
        ? this.indeterminateIcon
        : this.meta.isChecked
          ? this.checkedIcon
          : this.uncheckedIcon;
    },
  },
});
</script>
