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
        v-for="position in positions"
        :key="position.key"
        :value="position.key"
      >
        {{ position.label }}
      </ToggleGroupItem>
    </ToggleGroup>
  </FormField>
</template>

<script lang="ts" setup>
import { and, isObjectControl, optionIs } from "@jsonforms/core";
import { useJsonFormsControl } from "@jsonforms/vue";
import {
  FormField,
  ToggleGroup,
  ToggleGroupItem,
  useUpmindUIRenderer
} from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { find, map } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
/**
 * @module form/renderers/FilterExclusiveToggleGroupRenderer
 * @description A THREE-WAY toggle over an object leaf whose keys are mutually
 * exclusive query operators on the SAME wire column (`billing_cycle_days.neq`
 * / `.eq`, R38 item 1) — never two independent controls. `options.items`
 * names each position: the rest position carries no `key` and writes `{}`;
 * every other position writes `{ [key]: value }` and clears its sibling key.
 * Labels resolve through JSON Forms enum-option i18n (`<element.i18n>.<member>`).
 */

type Position = { member: string; key?: string; value?: unknown };

const props = defineProps<RendererProps<ControlElement>>();

const { control, formFieldProps, handleChange } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);
const { t } = useI18n();

const items = computed<Position[]>(
  () => (control.value.uischema as ControlElement).options?.items ?? []
);

const positions = computed(() =>
  map(items.value, item => ({
    key: item.member,
    label: t(`${control.value.uischema.i18n}.${item.member}`)
  }))
);

const activeMember = computed(() => {
  const data = control.value.data as Record<string, unknown> | undefined;
  const active = find(
    items.value,
    item =>
      !!item.key && data?.[item.key] !== undefined && data?.[item.key] !== null
  );
  return active?.member ?? find(items.value, item => !item.key)?.member;
});

const selected = computed(() => activeMember.value);

function onPick(member?: unknown): void {
  const picked = find(items.value, item => item.member === member);
  handleChange(
    control.value.path,
    picked?.key ? { [picked.key]: picked.value } : {}
  );
}
</script>

<script lang="ts">
export const tester = {
  rank: 4,
  controlType: and(
    isObjectControl,
    optionIs("format", "filter-exclusive-toggle-group")
  )
};
</script>
