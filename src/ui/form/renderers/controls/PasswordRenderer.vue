<template>
  <FormField v-bind="formFieldProps">
    <InputGroup class="relative w-full">
      <Input
        :max="safeMax"
        :min="safeMin"
        :placeholder="appliedOptions?.placeholder"
        :type="unmask ? 'text' : 'password'"
        :autocomplete="appliedOptions?.autocomplete || 'current-password'"
        :auto-focus="appliedOptions?.autoFocus"
        :maxlength="appliedOptions?.maxLength"
        :minlength="appliedOptions?.minLength"
        :pattern="appliedOptions?.pattern"
        :readonly="appliedOptions?.readonly"
        :required="appliedOptions?.required"
        :disabled="appliedOptions?.disabled"
        :model-value="control.data"
        @update:modelValue="onInput"
      >
        <template #append>
          <Link
            :class="unmask ? 'opacity-100' : 'opacity-50 hover:opacity-100'"
            @click.prevent="unmask = !unmask"
            :focusable="false"
          >
            <Icon v-if="unmask" icon="eye-off" size="2xs" />
            <Icon v-else icon="eye" size="2xs" />
          </Link>
        </template>
      </Input>
    </InputGroup>

    <template v-if="!isEmpty(appliedOptions?.requirements)" #messages>
      <FormMessage
        v-if="formFieldProps.touched && fieldErrors"
        :errors="fieldErrors"
        :formMessageId="`form-item-message-${control.id}`"
        :name="control.path"
      />
    </template>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { isStringControl, and, or, optionIs, formatIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import { computed, ref } from "vue";
// --- components
import InputGroup from "../../../groups/InputGroup.vue";
import { Icon } from "../../../icon";
import { Input } from "../../../input";
import { Link } from "../../../link";
import FormField from "../../FormField.vue";
import FormMessage from "../../FormMessage.vue";
// --- utils
import { useUpmindUIRenderer } from "../utils";
import { get, includes, isEmpty, isNil, map, reject } from "lodash-es";
// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const unmask = ref(false);

const fieldErrors = computed(() => {
  const requirements = appliedOptions.value?.requirements;
  const errors = appliedOptions.value?.error;
  if (!requirements || isEmpty(errors)) return "";

  // Collect keys of requirements not yet satisfied by the current value
  const value = control.value?.data || "";
  const failing = map(
    reject(requirements, (r: { pattern: string }) =>
      new RegExp(r.pattern).test(value)
    ),
    "key"
  ) as string[];
  if (isEmpty(failing)) return "";

  // Compose i18n key — prefix with "missing_" when min_length already passes
  // e.g. "min_length_lowercase_number" vs "missing_lowercase"
  const prefix = includes(failing, "min_length") ? "" : "missing_";
  return get(errors, `${prefix}${failing.join("_")}`, "");
});

const safeMin: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.min;
  if (!isNil(applied)) return applied;

  const minimum = control.value?.schema?.minimum;
  if (!isNil(minimum)) return minimum;

  return undefined;
});

const safeMax: ComputedRef<number | undefined> = computed(() => {
  const applied = appliedOptions.value?.max;
  if (!isNil(applied)) return applied;

  const maximum = control.value?.schema?.maximum;
  if (!isNil(maximum)) return maximum;

  return undefined;
});
</script>

<script lang="ts">
export const tester = {
  rank: 2,
  controlType: and(
    isStringControl,
    or(formatIs("password"), optionIs("type", "password"))
  )
};
</script>
