<template>
  <UpwTextbox
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data"
    @change="onChange"
    :type="safeType"
  />
</template>

<script lang="ts">
// --- external
import { computed, defineComponent } from "vue";
import { isDateTimeControl, isDateControl, or } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

// --- components
import UpwTextbox from "../../../textbox/Textbox.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { useDateFormat } from "@vueuse/core";
import { isArray, includes } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

export default defineComponent({
  name: "DateRenderer",
  components: {
    UpwTextbox,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  setup(props: RendererProps<ControlElement>) {
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
      formattedData: computed(() => {
        const formatted = renderer.control.value.data
          ? useDateFormat(renderer.control.value.data, format.value)
          : undefined;
        return formatted?.value;
      }),
      safeType: computed(() => (isDateTime.value ? "datetime-local" : "date")),
    };
  },
});

export const tester = {
  rank: 2,
  controlType: or(isDateTimeControl, isDateControl),
};
</script>
