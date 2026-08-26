<template>
  <FormField v-bind="formFieldProps">
    <Select
      :model-value="control.data?.toString()"
      :items="items"
      :placeholder="appliedOptions?.placeholder"
      :size="appliedOptions?.size"
      class="w-full"
      @update:model-value="write"
    />
  </FormField>
</template>

<script lang="ts" setup>
import { isEnumControl } from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { Select } from "@upmind/ui";
import { computed } from "vue";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { isNil } from "lodash-es";
import type { ControlElement, EnumOption, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, appliedOptions, handleChange, touched } =
  useUpmindUIRenderer(useJsonFormsEnumControl(props));

// `handleChange`, not `onInput`: the unset position writes `null`, which
// `onInput` drops as "not dirty", so the previous value would stand. `onInput`
// also marks the field touched, so the swap has to keep doing that by hand —
// under ValidateAndHide an untouched required enum shows no error until submit.
function write(value?: unknown): void {
  handleChange(control.value.path, isNil(value) ? null : value);
  touched.value = true;
}

/**
 * The enum options, schema-level overrides first, then the control's, else none.
 */
const items = computed(() => {
  const { options, schema } = control.value as {
    options: EnumOption[];
    schema: JsonSchema & { options?: EnumOption[] };
  };
  return schema.options || options || [];
});
</script>

<script lang="ts">
export const tester = { rank: 2, controlType: isEnumControl };
</script>
