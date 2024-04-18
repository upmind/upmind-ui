<template>
  <control-wrapper v-bind="controlWrapper" :is-focused="isFocused" :size="size">
    <upw-checkbox
      type="checkbox"
      :disabled="!control.enabled"
      :id="control.id + '-input'"
      :invalid="meta.isInvalid"
      :model-value="control.data"
      @blur="isFocused = false"
      @change="onChange"
      @focus="isFocused = true"
      :upwind-config="[config, upwindConfig]"
    />
  </control-wrapper>
</template>

<script lang="ts">
// --- global
import { computed, defineComponent } from "vue";
import { isBooleanControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ControlWrapper from "../wrapper/RendererInline.vue";
import UpwCheckbox from "../../../../checkbox/Checkbox.vue";
// import UpwCheckbox from "../../../../radio/Radio.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindRenderer } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../types";
import { isEmpty, isNil } from "lodash-es";
// ----------------------------------------------

export default defineComponent({
  name: "StringRenderer",
  components: {
    ControlWrapper,
    UpwCheckbox,
  },
  props: {
    ...rendererProps<ControlElement>(),
    size: {
      type: String as PropType<InputProps["size"]>,
      default: null,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props: RendererProps<ControlElement>) {
    const meta = computed(() => ({
      isChecked: !!renderer.control.value.data,
      isIndeterminate: isNil(renderer.control.value.data),
      isInvalid: !isEmpty(renderer.control.value.errors),
      isDirty: !isNil(renderer.control.value.data),
      isFocused: renderer.isFocused.value,
      isRequired: renderer.control.value.required,
      isVisible: renderer.control.value.visible,
      isDisabled: !renderer.control.value.enabled,
    }));

    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target.checked
    );

    // we dont process styles as  we are using an upwind control, so rather pass the configs and allow the control to handle it
    return {
      ...renderer,
      meta,
      config,
    };
  },
});

export const tester = { rank: 3, controlType: isBooleanControl };
</script>
