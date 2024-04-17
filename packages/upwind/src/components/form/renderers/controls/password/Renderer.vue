<template>
  <control-wrapper v-bind="controlWrapper" :is-focused="isFocused" :size="size">
    <input
      :autocomplete="appliedOptions.autocomplete"
      :cols="appliedOptions.cols"
      :disabled="!control.enabled"
      :id="control.id + '-input'"
      :max="appliedOptions?.max || control?.schema?.maximum"
      :min="appliedOptions?.min || control?.schema?.minimum"
      :placeholder="appliedOptions.placeholder"
      :type="unmask ? 'input' : 'password'"
      :value="control.data"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
      :class="styles.input.root"
    />

    <template #append>
      <!-- NB: single button to maintain tabindex/toggle with keyboard -->
      <button
        :class="styles.input.button"
        @click.prevent="unmask = !unmask"
        color="current"
        size="sm"
      >
        {{ !unmask ? "Show" : "Hide" }}
      </button>
    </template>
  </control-wrapper>
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";
import { isStringControl, formatIs, and } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ControlWrapper from "../wrapper/Renderer.vue";
import UpwButton from "../../../../button/Button.vue";
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
  name: "PasswordRenderer",
  components: {
    ControlWrapper,
    UpwButton,
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
  data() {
    return {
      unmask: false,
    };
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
  controlType: and(isStringControl, formatIs("password")),
};
</script>
