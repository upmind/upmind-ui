<template>
  <input
    :id="control.id + '-input'"
    type="hidden"
    :value="control.data"
    @change="onChange"
  />
</template>

<script lang="ts">
// --- global
import { defineComponent } from "vue";
import { uiTypeIs, formatIs, schemaMatches, and, or } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components

// --- local

// --- utils
import { useUpwindRenderer } from "../../utils";
import { has } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "HiddenRenderer",
  components: {},
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target.value || undefined
    );
    return {
      ...renderer,
    };
  },
});

export const tester = {
  rank: 2,
  controlType: and(
    uiTypeIs("Control"),
    or(
      formatIs("hidden"),
      schemaMatches(schema => has(schema, "const"))
    )
  ),
};
</script>
