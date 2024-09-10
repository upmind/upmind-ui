<template>
  <upw-input
    :id="id"
    :label="label"
    :text="text"
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
    :autofocus="autofocus"
    :dirty="meta.isDirty"
    :disabled="meta.isDisabled"
    :visible="meta.isVisible"
    :required="meta.isRequired"
    :no-required="noRequired"
    :no-feedback="noFeedback"
    :no-status="noStatus"
    :persist-feedback="persistFeedback"
    variant="flat"
    :upwind-config="{ input: config.radiolist.input }"
  >
    <h-radio-group v-model="selected" as="ul" :class="styles.radiolist.root">
      <h-radio-group-option
        as="li"
        v-for="(item, index) in items"
        :key="item.value"
        :class="styles.radiolist.item"
        :value="item.value"
      >
        <upw-radio
          v-bind="{ ...safeAttrs, ...item }"
          variant="outline"
          :id="`${id}-option-${index}`"
          :errors="meta.errors"
          :size="size"
          :disabled="meta.isDisabled"
          :processing="meta.isProcessing"
          :model-value="isSelected(item.value)"
          :value="item.value"
          :upwind-config="{ input: config.radiolist.radio }"
          :no-input="noInput"
          no-status
          no-feedback
        >
          <!-- expose our core input slots -->
          <template #label="slotProps">
            <slot name="label" v-bind="{ item, ...slotProps }"></slot>
          </template>

          <template #prepend="slotProps">
            <slot name="prepend" v-bind="{ item, ...slotProps }"></slot>
          </template>

          <template #append="slotProps">
            <slot name="append" v-bind="{ item, ...slotProps }"></slot>
          </template>
        </upw-radio>
      </h-radio-group-option>
    </h-radio-group>
  </upw-input>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed, ref } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwInput from "../input/Input.vue";
import UpwRadio from "../radio/Radio.vue";
import { RadioGroup, RadioGroupOption } from "@headlessui/vue";
// --- utils
import { useStyles } from "../../utils";
import { isEmpty, isEqual, isNil, pick } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { InputProps, IconProps } from "../input/types";
import type { RadioListProps } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwRadioList",
  inheritAttrs: false,
  emits: ["update:modelValue", "change"],
  components: {
    UpwInput,
    UpwRadio,
    HRadioGroup: RadioGroup,
    HRadioGroupOption: RadioGroupOption,
  },

  props: {
    items: { required: true, type: Array, default: () => [] },
    // ---
    id: {
      type: String,
      default: () => "radiolist-" + Math.random().toString(36).substr(2, 9),
    },
    label: { type: String },
    text: { type: String },
    description: { type: String },
    errors: { type: [String, Array] },
    // ---
    size: { type: String as PropType<InputProps["size"]> },
    layout: {
      type: String as PropType<RadioListProps["layout"]>,
      default: "stacked",
    },
    stretch: { type: Boolean, default: false },
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
      default: "dot",
    },
    uncheckedIcon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      default: null,
    },
    // ---
    modelValue: { type: String },
    // ---
    autofocus: { type: Boolean },
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    processing: { type: Boolean },
    // ---
    noInput: { type: Boolean },
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noFeedback: { type: Boolean },
    persistFeedback: { type: Boolean },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Array, Object], default: null },
  },

  setup(props) {
    const meta = computed(() => ({
      size: props.size,
      layout: props.layout,
      // ---
      isStretched: props.stretch,
      // ---
      isDisabled: props.disabled,
      isProcessing: props.processing,
      isVisible: props.visible,
      isRequired: props.required,
      isDirty: !isNil(props.modelValue),
      isChecked: !!props.modelValue,
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.modelValue),
    }));

    const styles = useStyles("radiolist", meta, config, props.upwindConfig);

    const selected = ref(props.modelValue);
    return {
      meta,
      styles,
      config,
      selected,
      isSelected: value => {
        return selected.value == value;
      },
    };
  },
  computed: {
    safeAttrs() {
      return pick(this.$attrs, [
        "class",
        "value",
        "readonly",
        "autofocus",
        "tabindex",
        "placeholder",
        "maxlength",
        "name",
        "onChange",
        "onFocus",
        "onBlur",
      ]);
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(value, oldValue) {
        if (value === oldValue) return;
        this.selected = value;
      },
    },
    selected: {
      handler(value, prevValue) {
        if (this.disabled || this.processing || value == prevValue) return;

        this.$emit("update:modelValue", value);
        // forward the event to the input control that will trigger the update
        // NB: this is not a DOM event so we need to fake one for the renderer
        this.$emit("change", {
          currentTarget: { value },
        });
      },
    },
  },
});
</script>
