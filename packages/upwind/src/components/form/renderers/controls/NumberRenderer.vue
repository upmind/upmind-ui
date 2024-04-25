<template>
  <upw-textbox
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data"
    :step="safeStep"
    :max="safeMax"
    :min="safeMin"
    type="number"
    @change="onChange"
  />
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";
import { isNumberControl, isIntegerControl, or } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import UpwTextbox from "../../../textbox/Textbox.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { isNil, get, isArray, includes } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "NumberRenderer",
  components: {
    UpwTextbox,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const isInteger = computed(() => {
      let type = renderer.control.value.schema.type;
      type = isArray(type) ? type : [type];
      return includes(type, "integer");
    });

    const renderer = useUpwindRenderer(useJsonFormsControl(props), target =>
      isNil(target.value)
        ? undefined
        : isInteger.value
          ? parseInt(target.value)
          : parseFloat(target.value)
    );

    return {
      ...renderer,
      isInteger,
    };
  },
  computed: {
    safeStep(): number {
      const defaultStep = this.isInteger ? 1 : 0.1;
      const multipleOf = get(this.control, "schema.multipleOf", defaultStep);
      return get(this.appliedOptions, "step", multipleOf);
    },
    safeMin(): number | null {
      const applied = this.appliedOptions?.min;
      if (!isNil(applied)) return applied;

      const minimum = this.control?.schema?.minimum;
      if (!isNil(minimum)) return minimum;

      const exclusiveMinimum = this.control?.schema?.exclusiveMinimum;
      if (!isNil(exclusiveMinimum)) return exclusiveMinimum + this.safeStep;

      return null;
    },
    safeMax(): number | null {
      const applied = this.appliedOptions?.max;
      if (!isNil(applied)) return applied;

      const maximum = this.control?.schema?.maximum;
      if (!isNil(maximum)) return maximum;

      const exclusiveMaximum = this.control?.schema?.exclusiveMaximum;
      if (!isNil(exclusiveMaximum)) return exclusiveMaximum - this.safeStep;

      return null;
    },
  },
});

export const tester = {
  rank: 1,
  controlType: or(isNumberControl, isIntegerControl),
};
</script>
