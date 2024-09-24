<template>
  <UpwInput variant="flat">
    <UButton
      v-bind="{ ...control, ...appliedOptions }"
      :id="control.id + '-input'"
      :disabled="!control.enabled"
      @click="onClick"
      :value="!!control.data"
      v-show="control.visible"
      class="flex-nowrap"
    />
  </UpwInput>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";
import { isBooleanControl, and, optionIs } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import UButton from "../../../../ui/button/Button.ce.vue";
import UpwInput from "../../../input/Input.vue";

// --- utils
import { useUpwindRenderer } from "../utils";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

// ----------------------------------------------

export default defineComponent({
  name: "BooleanRenderer",
  components: {
    UButton,
    UpwInput,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target.checked
    );

    // we dont process styles as  we are using an upwind control, so rather pass the configs and allow the control to handle it
    return {
      ...renderer,
      onClick: event => {
        // forward the event to the input control that will trigger the update
        // NB: this is not an input DOM event so we need to fake one for the renderer
        renderer.onChange({
          currentTarget: { checked: !renderer.control.value.data },
        });
      },
    };
  },
});

export const tester = {
  rank: 3,
  controlType: and(isBooleanControl, optionIs("format", "button")),
};
</script>
