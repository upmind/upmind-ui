<template>
  <FormField v-bind="delegatedProps">
    <input type="hidden" :value="control.data" />
  </FormField>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { uiTypeIs, formatIs, schemaMatches, and, or } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { has } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "HiddenRenderer",
  components: {
    FormField,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(useJsonFormsControl(props));
    return {
      ...renderer,
    };
  },
  computed: {
    delegatedProps() {
      return {
        id: this.control.id,
        name: this.control.path,
        errors: this.control.errors,
        // ---
        required: this.control.required,
        disabled: !this.control.enabled,
      };
    },
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
