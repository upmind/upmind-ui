<template>
  <FormField v-bind="fieldProps">
    <InputExtended
      v-bind="appliedOptions"
      :model-value="control.data"
      :class="[{ 'py-0 pr-0': description }, appliedOptions?.class]"
      @update:modelValue="onInput"
    >
      <template #append>
        <footer v-if="description" :class="styles.form.sld.description">
          {{ description }}
        </footer>
      </template>
    </InputExtended>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "../form.config";

// --- components
import { FormField, InputExtended } from "@upmind-automation/upmind-ui";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { omit } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const fieldProps = computed(() => {
  return omit(formFieldProps.value, "description") as any;
});

const description = computed(() => {
  return formFieldProps.value.description;
});

const styles = useStyles(["form.sld.description"], {}, config) as ComputedRef<{
  form: {
    sld: {
      description: string;
    };
  };
}>;
</script>

<script lang="ts">
import { isStringControl, formatIs, and } from "@jsonforms/core";
export const tester = {
  rank: 3,
  controlType: and(isStringControl, formatIs("sld")),
};
</script>
