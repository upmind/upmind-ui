<template>
  <UpwInput
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
    :auto-focus="autoFocus"
    :dirty="meta.isDirty"
    :disabled="meta.isDisabled"
    :visible="meta.isVisible"
    :required="meta.isRequired"
    :no-required="noRequired"
    :no-feedback="noFeedback"
    :no-status="noStatus"
    :no-label="noLabel"
    :persist-feedback="persistFeedback"
    layout="stacked"
    variant="outline"
  >
    <template #prepend>
      <slot name="prepend" v-bind="{ styles: styles.textbox }"></slot>
    </template>

    <input
      :id="id"
      v-bind="safeAttrs"
      :disabled="disabled"
      :value="modelValue"
      :class="styles.textbox.root"
      @input="onChange"
      :aria-invalid="meta.isInvalid"
    />

    <template #append>
      <slot name="append" v-bind="{ styles: styles.textbox }"></slot>
    </template>
  </UpwInput>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed, ref, onMounted, nextTick } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwInput from "../input/Input.vue";

// --- utils
import { useStyles } from "../../utils";
import { isNil, isEmpty, pick } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { InputProps, IconProps } from "../input/types";

// ----------------------------------------------

export default defineComponent({
  name: "UwpwTextbox",
  inheritAttrs: false,
  emits: ["update:modelValue"],
  components: {
    UpwInput,
  },
  props: {
    id: {
      type: String,
      default: () => "textbox-" + Math.random().toString(36).substr(2, 9),
    },
    label: { type: String },
    description: { type: String },
    errors: { type: [String, Array] },
    // ---
    size: { type: String as PropType<InputProps["size"]> },
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
    // ---
    modelValue: { type: String },
    // ---
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    processing: { type: Boolean },
    autoFocus: { type: Boolean },
    // ---
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noLabel: { type: Boolean },
    noFeedback: { type: Boolean },
    persistFeedback: { type: Boolean },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },

  setup(props, { emit }) {
    const meta = computed(() => ({
      size: props.size,
      // ---
      isDisabled: props.disabled,
      isProcessing: props.processing,
      isVisible: props.visible,
      isRequired: props.required,
      isDirty: !isNil(props.modelValue),
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.modelValue),
    }));

    const styles = useStyles("textbox", meta, config, props.upwindConfig);

    return {
      meta,
      styles,

      onChange: event => {
        if (props.disabled || props.processing) return;
        emit("update:modelValue", event.target.value);
      },
    };
  },
  computed: {
    safeAttrs() {
      return pick(this.$attrs, [
        "type",
        "class",
        "value",
        "readonly",
        "placeholder",
        "focus",
        "tabindex",
        "maxlength",
        "name",
        "onChange",
        "onFocus",
        "onBlur",
        "autocomplete",
      ]);
    },
  },
});
</script>
