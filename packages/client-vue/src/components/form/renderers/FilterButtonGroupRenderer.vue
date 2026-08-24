<template>
  <FormField v-bind="formFieldProps">
    <ToggleGroup
      type="single"
      :model-value="selected"
      :disabled="!control.enabled"
      size="sm"
      @update:model-value="onPick"
    >
      <ToggleGroupItem
        v-for="option in control.options"
        :key="toKey(option.value)"
        :value="toKey(option.value)"
      >
        {{ option.label }}
      </ToggleGroupItem>
    </ToggleGroup>
  </FormField>
</template>

<script lang="ts" setup>
import {
  and,
  isBooleanControl,
  isEnumControl,
  optionIs
} from "@jsonforms/core";
import { useJsonFormsEnumControl } from "@jsonforms/vue";
import { ToggleGroup, ToggleGroupItem } from "@upmind/ui";
import { computed } from "vue";
import FormField from "../engine/FormField.vue";
import { useUpmindUIRenderer } from "../engine/renderers/utils";
import { find, isNil } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/FilterButtonGroupRenderer
 * @description A boolean filter leaf as a segmented control showing ALL THREE of
 * its states at once — `All │ Yes │ No`. The positions ARE the leaf's own `enum`
 * members, `null` among them, so each label resolves through JSON Forms'
 * enum-option i18n (`<element.i18n>.true` / `.false` / `.null`) and none is
 * named here.
 */

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, handleChange } = useUpmindUIRenderer(
  useJsonFormsEnumControl(props)
);

/** Radix keys by string; `null` becomes the literal `"null"`. */
function toKey(value: unknown): string {
  return isNil(value) ? "null" : String(value);
}

/**
 * The CURRENT selection as a key. A leaf its module has never written carries
 * no value at all, which is the same unset the `null` member names.
 */
const selected = computed(() => toKey(control.value.data ?? null));

// --- methods

/**
 * `handleChange`, not the renderer's `onInput`: the unset position writes
 * `null`, which `onInput` drops as "not dirty".
 */
function onPick(key: unknown): void {
  // Radix emits AcceptableValue | AcceptableValue[]; single-select never
  // yields the array arm, and keys are minted by `toKey`, so String() is safe.
  const picked = String(key);
  const option = find(control.value.options, o => toKey(o.value) === picked);
  handleChange(control.value.path, option?.value ?? null);
}
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(
    isBooleanControl,
    isEnumControl,
    optionIs("format", "button-group")
  )
};
</script>
