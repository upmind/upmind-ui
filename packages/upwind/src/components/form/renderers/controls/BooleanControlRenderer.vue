<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
  >
    <input
      :id="control.id + '-input'"
      type="checkbox"
      :class="[
        styles.control.checkbox,
        controlWrapper.errors ? styles.control.error.input : null,
      ]"
      :checked="!!control.data"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
  </control-wrapper>
</template>

<script lang="ts">
import type { ControlElement } from "@jsonforms/core";
import { isBooleanControl } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

import ControlWrapper from "./wrapper/WrapperInline.vue";
import { useUpwindRenderer } from "../utils";

const controlRenderer = defineComponent({
  name: "BooleanRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useUpwindRenderer(
      useJsonFormsControl(props),
      target => target.checked
    );
  },
});

export default controlRenderer;

export const tester = { rank: 1, controlType: isBooleanControl };
</script>
