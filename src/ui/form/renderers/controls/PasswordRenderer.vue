<template>
  <FormField v-bind="formFieldProps">
    <InputGroup class="relative w-full">
      <Input
        class="pr-12"
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
      />
      <Button
        class="absolute right-0 top-0 my-auto mr-3 mt-0.5 transition-all duration-300"
        :class="unmask ? 'opacity-100' : 'opacity-50 hover:opacity-100'"
        variant="link"
        size="sm"
        @click.prevent="unmask = !unmask"
      >
        <Icon v-if="unmask" icon="view" size="2xs" />
        <Icon v-else icon="view-off" size="2xs" />
      </Button>
    </InputGroup>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import FormField from "../../FormField.vue";
import InputGroup from "../../../groups/InputGroup.vue";
import { Input } from "../../../input";
import { Button } from "../../../button";
import { Icon } from "../../../icon";

// --- utils
import { useUpmindUIRenderer } from "../utils";
import { isNil } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, formFieldProps, onInput } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);

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
</script>

<script lang="ts">
import { isStringControl, and, or, optionIs, formatIs } from "@jsonforms/core";

export const tester = {
  rank: 2,
  controlType: and(
    isStringControl,
    or(formatIs("password"), optionIs("type", "password"))
  ),
};
</script>
