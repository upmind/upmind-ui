<template>
  <control-wrapper
    v-bind="controlWrapper"
    :styles="styles"
    :is-focused="isFocused"
    :applied-options="appliedOptions"
  >
    <upm-lookup
      :id="control.id + '-lookup'"
      :class="[
        styles.control.lookup,
        controlWrapper.errors ? styles.control.error.input : null,
      ]"
      :lookup="lookup"
      :model-value="control.data"
      :disabled="!control.enabled"
      :title="appliedOptions.title"
      :no-add="appliedOptions.noAdd"
      @change="onChange"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
  </control-wrapper>
</template>

<script lang="ts">
import type {
  Tester,
  ControlElement,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";

import { rankWith, schemaMatches, isEnumControl, and } from "@jsonforms/core";

import { defineComponent, defineAsyncComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import ControlWrapper from "./ControlWrapper.vue";
import { useDaisyControl } from "../util";
import { has, isFunction, get } from "lodash-es";

const controlRenderer = defineComponent({
  name: "EnumLookupControlRenderer",
  components: {
    ControlWrapper,

    UpmLookup: defineAsyncComponent(() =>
      import("@upmind/ui").then(m => m.UpmLookup)
    ),
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const inputControl = useDaisyControl(
      useJsonFormsOneOfEnumControl(props),
      target => (target.selectedIndex === 0 ? undefined : target.value)
    );

    const lookup = get(inputControl, "control.value.schema.lookup");
    return {
      lookup,
      ...inputControl,
    };
  },
});

export default controlRenderer;

const isLookupControl = (): Tester =>
  and(
    isEnumControl,
    schemaMatches(schema => has(schema, "lookup")),
    schemaMatches(schema => isFunction(get(schema, "lookup")))
  );

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, isLookupControl()),
};
</script>
