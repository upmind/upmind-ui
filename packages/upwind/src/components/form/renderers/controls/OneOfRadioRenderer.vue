<template>
  <upw-radio-list
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data"
    :items="control.options"
    @change="onChange"
  >
  </upw-radio-list>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isOneOfEnumControl, optionIs, and } from "@jsonforms/core";
import { rendererProps, useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
// --- components
import UpwRadioList from "../../../radio/RadioList.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { find } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "OneOfRadioRenderer",
  components: {
    UpwRadioList,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsOneOfEnumControl(props),
      target =>
        find(
          renderer.control.value.options,
          ({ value }) => value == target.value
        )?.value
    );
    return {
      ...renderer,
    };
  },
});

export const tester = {
  rank: 3,
  controlType: and(isOneOfEnumControl, optionIs("format", "radio")),
};
</script>
