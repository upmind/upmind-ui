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
        styles.control.input,
        appliedOptions?.trim
          ? styles.control.size.trim
          : styles.control.size.full,
        controlWrapper.errors ? styles.control.error.input : null,
      ]"
      :value="control.data"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      :type="unmask ? 'input' : 'password'"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
    <span class="absolute right-1 top-0" v-if="control.data">
      <button
        class="btn btn-link btn-square text-inherit"
        @click="unmask = true"
        v-if="!unmask"
      >
        <eye-icon class="h-5 w-5" />
        <span class="sr-only">Show password value</span>
      </button>
      <button
        class="btn btn-link btn-square text-inherit"
        @click="unmask = false"
        v-else
      >
        <eye-slash-icon class="h-5 w-5" />
        <span class="sr-only">Hide password value</span>
      </button>
    </span>
  </control-wrapper>
</template>

<script lang="ts">
import type {
  ControlElement,
  JsonFormsRendererRegistryEntry,
  Tester,
} from "@jsonforms/core";

import { uiTypeIs, formatIs, and, or } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useprelineControl } from "../util";

const controlRenderer = defineComponent({
  name: "StringControlPrelineRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  data() {
    return {
      unmask: false,
    };
  },
  setup(props: RendererProps<ControlElement>) {
    return useprelineControl(
      useJsonFormsControl(props),
      target => target.value || undefined
    );
  },
});

export default controlRenderer;

export const tester = {
  rank: 2,
  controlType: and(uiTypeIs("Control"), or(formatIs("password"))),
};
</script>
