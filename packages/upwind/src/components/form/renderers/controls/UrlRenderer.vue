<template>
  <upw-textbox
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data"
    @change="onChange"
    type="url"
  />
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isStringControl, formatIs, and, or } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import UpwTextbox from "../../../textbox/Textbox.vue";

// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "UwrlRenderer",
  components: {
    UpwTextbox,
  },
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
    isStringControl,
    or(
      formatIs("uri"),
      formatIs("uri-reference"),
      formatIs("iri"),
      formatIs("iri-reference")
    )
  ),
};
</script>
