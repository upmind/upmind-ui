<template>
  <FormField v-bind="{ ...delegatedProps, ...appliedOptions }">
    <Input
      :disabled="!control.enabled"
      :model-value="control.data"
      :max="safeMax"
      :min="safeMin"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isStringControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";
import { Input } from "../../../input";

// --- utils
import { useUpwindRenderer } from "../utils";
import { isNil } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "StringRenderer",
  components: {
    FormField,
    Input,
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
        label: this.control.label,
        description: this.control.description,
        // ---
        required: this.control.required,
        disabled: !this.control.enabled,
        visible: this.control.visible,
      };
    },

    safeMin(): number | undefined {
      const applied = this.appliedOptions?.min;
      if (!isNil(applied)) return applied;

      const minimum = this.control?.schema?.minimum;
      if (!isNil(minimum)) return minimum;

      return undefined;
    },
    safeMax(): number | undefined {
      const applied = this.appliedOptions?.max;
      if (!isNil(applied)) return applied;

      const maximum = this.control?.schema?.maximum;
      if (!isNil(maximum)) return maximum;

      return undefined;
    },
  },
});

export const tester = { rank: 1, controlType: isStringControl };
</script>
