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
    <ToggleGroup
      :items="positions"
      :model-value="selected"
      :disabled="!control.enabled"
      size="sm"
      @update:model-value="onPick"
    />
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
  FormField,
  ToggleGroup,
  useUpmindUIRenderer
} from "@upmind-automation/upmind-ui";
import { find, get, isNil, map, reject, toString } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ToggleGroupItem } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/FilterToggleGroupRenderer
 * @description A boolean filter leaf as a two-position toggle group, where
 * un-pressing the active position is the unset. Whether the field draws a label
 * is FormField's own `hasLabel` decision, driven by the catalogue entry — a
 * state-naming pair (`Bounced │ Not bounced`) files its label as `null`. Both
 * labels resolve through JSON Forms' enum-option i18n
 * (`<element.i18n>.true` / `.false`).
 *
 * Radix keys BOTH its positions and its model by string — it calls
 * `String.prototype.includes` on whatever the model binds
 * (`radix-vue@1.9.17/dist/index.js:18316`), so a boolean throws — and that
 * mapping is contained here, at the primitive's boundary. What the control
 * WRITES is always the leaf's own enum member, never a string: `null` for the
 * unset, which radix's own `== null` guard carries and its declared model
 * domain (`string | string[] | undefined`) spells `undefined`.
 */

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, handleChange } = useUpmindUIRenderer(
  useJsonFormsEnumControl(props)
);

/** The DRAWN positions — the unset member is un-pressing, never a button. */
const positions = computed<ToggleGroupItem[]>(() =>
  map(
    reject(control.value.options, option => isNil(option.value)),
    option => ({ value: toString(option.value), label: option.label })
  )
);

const selected = computed(() =>
  isNil(control.value.data) ? undefined : toString(control.value.data)
);

// --- methods

/**
 * The pressed position's own enum member. Radix emits `undefined` when the
 * active position is re-pressed — the clear — and a pick matching no drawn
 * position is the unset member rather than the first one.
 */
function onPick(value?: unknown): void {
  // `handleChange`, not the renderer's `onInput`: the clear writes `null`,
  // which `onInput` drops as "not dirty".
  handleChange(
    control.value.path,
    get(
      find(control.value.options, option => toString(option.value) === value),
      "value",
      null
    )
  );
}
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: and(
    isBooleanControl,
    isEnumControl,
    optionIs("format", "toggle-group")
  )
};
</script>
