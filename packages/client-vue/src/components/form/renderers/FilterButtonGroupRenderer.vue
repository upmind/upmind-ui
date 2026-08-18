<template>
  <FormField
    v-bind="formFieldProps"
    :ui-config="{
      form: {
        field: 'flex-row flex-wrap items-center gap-3',
        label: 'w-auto shrink-0',
        control: 'w-auto'
      }
    }"
  >
    <ButtonGroup :items="positions" :disabled="!control.enabled" size="sm" />
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
import { computed } from "vue";
import {
  ButtonGroup,
  ButtonGroupTypes,
  FormField,
  useUpmindUIRenderer
} from "@upmind-automation/upmind-ui";
import { isEqual, map } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ButtonGroupItem } from "@upmind-automation/upmind-ui";
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

const positions = computed<ButtonGroupItem[]>(() =>
  map(control.value.options, option => ({
    type: ButtonGroupTypes.Button,
    // A leaf its module has never written carries no value at all, which is the
    // same unset the `null` member names.
    active: isEqual(control.value.data ?? null, option.value),
    props: { label: option.label },
    // `handleChange`, not the renderer's `onInput`: the unset position writes
    // `null`, which `onInput` drops as "not dirty".
    handler: () => handleChange(control.value.path, option.value)
  }))
);
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
