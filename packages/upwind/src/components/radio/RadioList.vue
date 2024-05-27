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
    :no-required="noRequired"
    :no-feedback="noFeedback"
    :no-status="noStatus"
    :persist-feedback="persistFeedback"
    variant="flat"
  >
    <ul :class="styles.radiolist.root">
      <li
        v-for="(item, index) in items"
        :key="item.value"
        :class="styles.radiolist.item"
        @click="onClick(item.value)"
      >
        <upw-radio
          :upwind-config="{ input: config.radiolist.radio }"
          v-bind="safeAttrs"
          :id="`${id}-option-${index}`"
          :errors="meta.errors"
          :size="size"
          variant="outlined"
          :label="item.label"
          :value="item.value"
          :model-value="isSelected(item.value)"
          no-status
          no-feedback
          @change="onChange"
        />
      </li>
    </ul>
  </upw-input>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwInput from "../input/Input.vue";
import UpwRadio from "../radio/Radio.vue";

// --- utils
import { useStyles } from "../../utils";
import { isEmpty, isNil, omit } from "lodash-es";

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
  },

  props: {
    items: { required: true, type: Array, default: () => [] },
    // ---
    id: {
      type: String,
      default: () => "radiolist-" + Math.random().toString(36).substr(2, 9),
    },
    label: { type: String },
    description: { type: String },
    errors: { type: String },
    // ---
    size: { type: String as PropType<InputProps["size"]>, default: null },
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
    required: { type: Boolean },
    visible: { type: Boolean, default: true },
    disabled: { type: Boolean },
    // ---
    noRequired: { type: Boolean },
    noStatus: { type: Boolean },
    noFeedback: { type: Boolean },
    persistFeedback: { type: Boolean, default: true },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Array, Object], default: null },
  },

  setup(props, { emit }) {
    const meta = computed(() => ({
      size: props.size,
      layout: props.layout,
      align: props.align,
      // ---
      isBlock: props.block,
      isStretched: props.stretch,
      // ---
      isDisabled: props.disabled,
      isVisible: props.visible,
      isRequired: props.required,
      isDirty: !isNil(props.modelValue),
      isChecked: !!props.modelValue,
      isInvalid: !isEmpty(props.errors),
      isValid: isEmpty(props.errors) && !isNil(props.modelValue),
    }));

    const styles = useStyles("radiolist", meta, config, props.upwindConfig);

    return {
      meta,
      styles,
      config,
      onClick: value => {
        emit("update:modelValue", value);
        // forward the event to the input control that will trigger the update
        // NB: this is not a DOM event so we need to fake one for the renderer
        emit("change", {
          currentTarget: { value },
        });
      },
      onChange: event => {
        emit("update:modelValue", event.target.value);
      },
      isSelected: value => {
        return props.modelValue == value;
      },
    };
  },
  computed: {
    safeAttrs() {
      // TODO: maybe whitelist input attributes
      return omit(this.$attrs, ["layout", "variant"]);
    },
  },
});
</script>
