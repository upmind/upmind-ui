<template>
  <UpwTextbox
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data"
    :max="safeMax"
    :min="safeMin"
    @change="onChange"
  />
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isStringControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import UpwTextbox from "../../../textbox/Textbox.vue";

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
  computed: {
    safeMin(): number | null {
      const applied = this.appliedOptions?.min;
      if (!isNil(applied)) return applied;

      const minimum = this.control?.schema?.minimum;
      if (!isNil(minimum)) return minimum;

      return null;
    },
    safeMax(): number | null {
      const applied = this.appliedOptions?.max;
      if (!isNil(applied)) return applied;

      const maximum = this.control?.schema?.maximum;
      if (!isNil(maximum)) return maximum;

      return null;
    },
  },
});

export const tester = { rank: 1, controlType: isStringControl };
</script>
