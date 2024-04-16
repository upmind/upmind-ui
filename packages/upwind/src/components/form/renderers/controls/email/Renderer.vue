<template>
  <control-wrapper
    v-bind="controlWrapper"
    :is-focused="isFocused"
    :size="size"
    :prepend-icon="controlWrapper.prependIcon || 'email'"
  >
    <input
      :autocomplete="appliedOptions.autocomplete"
      :cols="appliedOptions.cols"
      :disabled="!control.enabled"
      :id="control.id + '-input'"
      :max="appliedOptions?.max || control?.schema?.maximum"
      :min="appliedOptions?.min || control?.schema?.minimum"
      :placeholder="appliedOptions.placeholder"
      type="email"
      :value="control.data"
      @blur="isFocused = false"
      @change="onChange"
      @focus="isFocused = true"
      :class="styles.input.root"
    />
  </control-wrapper>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";
import { isStringControl, formatIs, and, or } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ControlWrapper from "../wrapper/Wrapper.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindRenderer } from "../../utils";
import { useStyles } from "../../../../../utils";

// --- types
import type { PropType } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputSize } from "../types";
// ----------------------------------------------

export default defineComponent({
  name: "UrlRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
    // ---  Additional Attributes
    size: {
      type: String as PropType<InputSize>,
      default: null,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props: RendererProps<ControlElement>) {
    const styles = useStyles("input", props, config, props.upwindConfig);
    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target.value || undefined
    );

    return {
      ...renderer,
      styles,
    };
  },
});

export const tester = {
  rank: 2,
  controlType: and(isStringControl, formatIs("email")),
};
</script>
