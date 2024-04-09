<template>
  <control-wrapper
    v-bind="controlWrapper"
    :upwind-config="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <input
      :autocomplete="appliedOptions.autocomplete"
      :cols="appliedOptions.cols"
      :disabled="!control.enabled"
      :id="control.id + '-input'"
      :max="appliedOptions?.max || control?.schema?.maximum"
      :min="appliedOptions?.min || control?.schema?.minimum"
      :placeholder="appliedOptions.placeholder"
      :type="appliedOptions.type"
      :value="control.data"
      @blur="isFocused = false"
      @change="onChange"
      @focus="isFocused = true"
      :class="styles.input"
    />
  </control-wrapper>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";
import { isStringControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ControlWrapper from "../ControlWrapper.vue";

// --- local
import config from "./config";

// --- utils
import { useprelineControl } from "../../utils";
import { useStyles } from "../../../../../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// ----------------------------------------------

export default defineComponent({
  name: "StringControlPrelineRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props: RendererProps<ControlElement>) {
    const styles = useStyles("form", { props }, config, props.upwindConfig);
    const control = useprelineControl(
      useJsonFormsControl(props),
      target => target.value || undefined
    );
    return {
      ...control,
      styles,
      stylesDeprecated: control.styles,
    };
  },
});

export const tester = { rank: 1, controlType: isStringControl };
</script>
