<template>
  <FormField v-bind="fieldProps">
    <Input
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
    </Input>
  </FormField>
</template>

<script lang="ts" setup>
import { isStringControl, formatIs, and } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed } from "vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import { FormField, Input } from "@upmind-automation/upmind-ui";
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import config from "../form.config";
import { omit } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// --- external

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

const styles = useStyles(["form.sld.description"], {}, config);
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(isStringControl, formatIs("sld"))
};
</script>
