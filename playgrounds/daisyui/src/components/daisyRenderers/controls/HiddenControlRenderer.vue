<template>
  <input :id="control.id + '-input'" type="hidden" :value="!!control.data" />
</template>

<script lang="ts">
import type {
  Tester,
  ControlElement,
  JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import {
  rankWith,
  uiTypeIs,
  formatIs,
  schemaMatches,
  and,
  or,
} from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

import ControlWrapper from "./ControlWrapperInline.vue";
import { useDaisyControl } from "../util";
import { has } from "lodash-es";

const controlRenderer = defineComponent({
  name: "BooleanControlRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useDaisyControl(
      useJsonFormsControl(props),
      target => target.checked
    );
  },
});

export default controlRenderer;

export const isHiddenControl: Tester = and(
  uiTypeIs("Control"),
  or(
    formatIs("hidden"),
    schemaMatches(schema => has(schema, "const"))
  )
);

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(3, isHiddenControl),
};
</script>
