<template>
  <control-wrapper v-bind="controlWrapper" :is-focused="isFocused" :size="size">
    <input
      :autocomplete="appliedOptions.autocomplete"
      :cols="appliedOptions.cols"
      :disabled="!control.enabled"
      :id="control.id + '-input'"
      :max="appliedOptions?.max || control?.schema?.maximum"
      :min="appliedOptions?.min || control?.schema?.minimum"
      :placeholder="appliedOptions.placeholder"
      :type="type"
      :value="formattedData"
      @blur="isFocused = false"
      @change="onChange"
      @focus="isFocused = true"
      :class="styles.input.root"
    />
  </control-wrapper>
</template>

<script lang="ts">
// --- global
import { computed, defineComponent } from "vue";
import { isDateTimeControl, isDateControl, or } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import ControlWrapper from "../wrapper/Wrapper.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindRenderer } from "../../utils";
import { useStyles } from "../../../../../utils";
import { useDateFormat } from "@vueuse/core";
import { isArray, includes } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputSize } from "../types";
// ----------------------------------------------

export default defineComponent({
  name: "DateRenderer",
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
    // ---  Additional Attributes
    size: {
      type: String as PropType<InputSize>,
      default: null,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props: RendererProps<ControlElement>) {
    const styles = useStyles("input", props, config, props.upwindConfig);

    const isDateTime = computed(() => {
      let type = renderer.control.value.schema.type;
      let format = renderer.control.value.schema?.format;
      type = isArray(type) ? type : [type];
      format = isArray(format) ? format : [format];

      return includes(type, "string") && includes(format, "date-time");
    });

    const format = computed(() =>
      isDateTime.value ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD"
    );

    const renderer = useUpwindRenderer(useJsonFormsControl(props), target => {
      const formatted = useDateFormat(target.value, format.value);
      return formatted.value;
    });

    return {
      ...renderer,
      styles,
      formattedData: computed(() => {
        const formatted = renderer.control.value.data
          ? useDateFormat(renderer.control.value.data, format.value)
          : undefined;
        return formatted?.value;
      }),
      type: computed(() => (isDateTime.value ? "datetime-local" : "date")),
    };
  },
});

export const tester = {
  rank: 2,
  controlType: or(isDateTimeControl, isDateControl),
};
</script>
