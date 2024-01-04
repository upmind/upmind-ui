<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <input
      :id="control.id + '-input'"
      :class="[
        styles.control.file,
        controlWrapper.errors ? styles.control.error.input : null
      ]"
      :value="control.data"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      type="file"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
  </control-wrapper>
</template>

<script lang="ts">
import type {
  ControlElement,
  JsonFormsRendererRegistryEntry
} from "@jsonforms/core";

import {
  rankWith,
  isStringControl,
  uiTypeIs,
  formatIs,
  optionIs,
  // scopeEndsWith,
  and,
  or
} from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useDaisyControl } from "../util";

const controlRenderer = defineComponent({
  name: "StringControlRenderer",
  components: {
    ControlWrapper
  },
  props: {
    ...rendererProps<ControlElement>()
  },
  data() {
    return {};
  },
  setup(props: RendererProps<ControlElement>) {
    return useDaisyControl(
      useJsonFormsControl(props),
      target => target.value || undefined
    );
  }
});

export default controlRenderer;

export const isFileControl = and(
  uiTypeIs("Control"),
  or(optionIs("type", "file"), formatIs("file"))
);

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, and(isStringControl, isFileControl))
};
</script>
