<template>
  <FormField v-bind="delegatedProps">
    <Select
      :disabled="!control.enabled"
      :model-value="control.data"
      :items="control.options"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isEnumControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsEnumControl } from "@jsonforms/vue";
// --- components
import FormField from "../../FormField.vue";
import { Select } from "../../../select";
// --- utils
import { useUpwindRenderer } from "../utils";
import { get } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "EnumRenderer",
  components: {
    FormField,
    Select,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(useJsonFormsEnumControl(props));
    return {
      ...renderer,
    };
  },
  computed: {
    delegatedProps() {
      const options = get(this.appliedOptions, "options", {});

      return {
        id: this.control.id,
        name: this.control.path,
        errors: this.control.errors,
        // ---
        label: this.control.label,
        description: this.control.description,
        // ---
        required: this.control.required,
        disabled: !this.control.enabled,
        visible: this.control.visible,
        ...options,
      };
    },
  },
});

export const tester = { rank: 2, controlType: isEnumControl };
</script>
