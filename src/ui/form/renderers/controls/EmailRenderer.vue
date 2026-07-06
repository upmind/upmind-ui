<template>
  <FormField v-bind="formFieldProps">
    <Input
      type="email"
      :placeholder="appliedOptions?.placeholder"
      :autocomplete="appliedOptions?.autocomplete"
      :disabled="appliedOptions?.disabled"
      :icon-append="iconAppend"
      :ui-config="{ input: { items: [styles.email.items] } }"
      :model-value="control.data"
      @update:modelValue="onInput"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { and, or, isStringControl, formatIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed } from "vue";
import { Input } from "../../../input";
import FormField from "../../FormField.vue";
import config from "./email.config";
import { useStyles } from "../../../../utils";
import { useUpmindUIRenderer } from "../utils";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();
const { control, formFieldProps, onInput, appliedOptions } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const stylesMeta = computed(() => ({
  isLoading: !!appliedOptions.value?.loading,
  isSuccess: !!appliedOptions.value?.success
}));

const styles = useStyles(["email.items"], stylesMeta, config);

const iconAppend = computed(() => {
  if (appliedOptions.value?.loading) return "loading-01";
  if (appliedOptions.value?.success) return "check";
  return appliedOptions.value?.iconAppend;
});
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(isStringControl, or(formatIs("email")))
};
</script>
