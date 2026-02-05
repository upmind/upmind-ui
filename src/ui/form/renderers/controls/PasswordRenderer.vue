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
// --- utils
import { useUpmindUIRenderer } from "../utils";
import { isNil } from "lodash-es";
// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ComputedRef } from "vue";
// -----------------------------------------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControl(props));

const unmask = ref(false);

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

export const tester = {
  rank: 2,
  controlType: and(
    isStringControl,
    or(formatIs("password"), optionIs("type", "password"))
  )
};
</script>
