<template>
  <input :id="control.id + '-input'" type="hidden" :value="!!control.data" />
</template>

<script lang="ts">
import type { Tester, ControlElement } from "@jsonforms/core";
import { uiTypeIs, formatIs, schemaMatches, and, or } from "@jsonforms/core";
import { defineComponent } from "vue";
import type { RendererProps } from "@jsonforms/vue";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

import { useprelineControl } from "../utils";
import { has } from "lodash-es";

const controlRenderer = defineComponent({
  name: "BooleanControlRenderer",
  components: {},
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    return useprelineControl(
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

export const tester = { rank: 3, controlType: isHiddenControl };
</script>
