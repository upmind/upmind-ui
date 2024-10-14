<template>
  <FormField v-bind="delegatedProps">
    <NumberField
      :disabled="!control.enabled"
      :max="safeMax"
      :min="safeMin"
      :step="safeStep"
      :model-value="control.data"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";
import { isNumberControl, isIntegerControl, or } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";
import { NumberField } from "../../../number-field";

// --- utils
import { useUpwindRenderer } from "../utils";
import { isNumber, get, isArray, includes } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "NumberRenderer",
  components: {
    FormField,
    NumberField,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      (value: string) => {
        return !isNumber(value)
          ? undefined
          : isInteger.value
            ? parseInt(value)
            : parseFloat(value);
      }
    );

    const isInteger = computed(() => {
      let type = renderer.control.value.schema.type;
      let types = isArray(type) ? type : [type];
      return includes(types, "integer");
    });

    return {
      ...renderer,
      isInteger,
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
    safeStep(): number {
      const defaultStep = this.isInteger ? 1 : 0.1;
      const multipleOf = get(this.control, "schema.multipleOf", defaultStep);
      return get(this.appliedOptions, "step", multipleOf);
    },
    safeMin(): number | undefined {
      const applied = this.appliedOptions?.min;
      if (isNumber(applied)) return applied;

      const minimum = this.control?.schema?.minimum;
      if (isNumber(minimum)) return minimum;

      const exclusiveMinimum = this.control?.schema?.exclusiveMinimum;
      if (isNumber(exclusiveMinimum)) return exclusiveMinimum + this.safeStep;

      return undefined;
    },
    safeMax(): number | undefined {
      const applied = this.appliedOptions?.max;
      if (isNumber(applied)) return applied;

      const maximum = this.control?.schema?.maximum;
      if (isNumber(maximum)) return maximum;

      const exclusiveMaximum = this.control?.schema?.exclusiveMaximum;
      if (isNumber(exclusiveMaximum)) return exclusiveMaximum - this.safeStep;

      return undefined;
    },
  },
});

export const tester = {
  rank: 1,
  controlType: or(isNumberControl, isIntegerControl),
};
</script>
