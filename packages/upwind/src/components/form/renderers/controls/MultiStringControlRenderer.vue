<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <textarea
      :id="control.id + '-input'"
      :class="[
        styles.control.textarea,
        controlWrapper.errors ? styles.control.error.input : null,
      ]"
      :value="control.data"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      :rows="appliedOptions.rows"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
  </control-wrapper>
</template>

<script lang="ts">
import type { ControlElement } from "@jsonforms/core";
import { isStringControl, isMultiLineControl, and } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./wrapper/Wrapper.vue";
import { useupwindControl } from "../utils";

const controlRenderer = defineComponent({
  name: "MultiStringControlRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useupwindControl(
      useJsonFormsControl(props),
      target => target.value || undefined
    );
  },
});

export default controlRenderer;

export const tester = {
  rank: 2,
  controlType: and(isStringControl, isMultiLineControl),
};
</script>
