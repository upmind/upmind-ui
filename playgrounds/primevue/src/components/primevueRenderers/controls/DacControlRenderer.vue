<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <upm-dac
      :id="control.id + '-dac'"
      :class="[
        styles.control.dac,
        controlWrapper.errors ? styles.control.error.input : null
      ]"
      :model-value="control.data"
      :disabled="!control.enabled"
      :autocomplete="appliedOptions.autocomplete"
      :placeholder="appliedOptions.placeholder"
      :multiple="appliedOptions.multiple"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
      compact
    />
  </control-wrapper>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from "vue";

import {
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
  scopeEndsWith,
  rankWith,
  uiTypeIs,
  formatIs,
  and,
  or
} from "@jsonforms/core";

import {
  rendererProps,
  useJsonFormsControl,
  type RendererProps
} from "@jsonforms/vue";

import ControlWrapper from "./ControlWrapper.vue";

import { useprimevueControl } from "../util";

const controlRenderer = defineComponent({
  name: "DacControlRenderer",
  components: {
    ControlWrapper,
    UpmDac: defineAsyncComponent(() => import("@upmind/ui").then(m => m.UpmDac))
  },
  props: {
    ...rendererProps<ControlElement>()
  },
  setup(props: RendererProps<ControlElement>) {
    return useprimevueControl(
      useJsonFormsControl(props),
      target => target?.value || undefined
    );
  }
});

export default controlRenderer;

/**
 * Tests whether the given UI schema is of type Control and whether the schema
 * or the uischema options has a 'time' format.
 * @type {Tester}
 */
export const isDomainControl = and(
  uiTypeIs("Control"),
  or(formatIs("domain_name"), scopeEndsWith("domain"))
);

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(2, isDomainControl)
};
</script>
