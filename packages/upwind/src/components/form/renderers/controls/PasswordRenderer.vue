<template>
  <upw-textbox
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :max="safeMax"
    :min="safeMin"
    :model-value="control.data"
    @change="onChange"
    :type="unmask ? 'input' : 'password'"
  />

  <!-- NB: single button to maintain tabindex/toggle with keyboard -->
  <button :class="styles.input.button" @click.prevent="unmask = !unmask">
    {{ !unmask ? "Show" : "Hide" }}
  </button>
</template>

<script lang="ts">
// --- external
import { defineComponent, ref } from "vue";
import { isStringControl, formatIs, and } from "@jsonforms/core";
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
  name: "PasswordRenderer",
  components: {
    UpwTextbox,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },

  setup(props: RendererProps<ControlElement>) {
    const unmask = ref(false);

    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target.value || undefined
    );
    return {
      ...renderer,
      unmask,
    };
  },
});

export const tester = {
  rank: 2,
  controlType: and(isStringControl, formatIs("password")),
};
</script>
