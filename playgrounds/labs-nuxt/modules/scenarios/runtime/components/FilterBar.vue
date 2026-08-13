<template>
  <UpmForm
    :schema="schema"
    :uischema="uischema"
    :model-value="model"
    :disabled="disabled"
    :data-attrs="{ 'data-test-key': 'filters' }"
    no-actions
    @update:model-value="onUpdate"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/FilterBar
 * @description The holistic filter bar — the module's OWN query schema and
 * uischema mounted through JSONForms, so the
 * `Filter` elements resolve against the renderer set `UpmForm` already
 * registers and the controls are whatever the declaration says. Presentation
 * (the flowing row of controls the declaration's `flow` layout draws) is the
 * uischema's, never this component's — including which control takes the row's
 * leftover width. It owns no model and no state: it reads the composable's
 * live criteria and writes back through the composable's own merging
 * `setCriteria` — the model stays composable-owned.
 *
 * The whole bar is refused through the form's own `disabled` while a scenario
 * drives the collection (`R6-23`): the declaration decides which controls exist,
 * so locking them one by one here would leave the next one it adds live.
 */

import { computed } from "vue";
import { UpmForm } from "@upmind-automation/client-vue";
import { get } from "lodash-es";
import type { FilterBarProps } from "./FilterBar.types";
import type { FormProps } from "@upmind-automation/upmind-ui";
// -----------------------------------------------------------------------------

const props = defineProps<FilterBarProps>();

const schema = computed(() => props.criteria.schema as FormProps["schema"]);
const uischema = computed(
  () => props.criteria.uischema as FormProps["uischema"]
);
const model = computed(() => props.criteria.model.value);

// Only the `filters` branch is written back. `setCriteria` merges at BRANCH
// level and returns the cursor to the first page for a write that does not
// carry its own `pagination` — handing it the whole parsed model would carry
// the live `pagination` and silently suppress that reset, leaving a new filter
// set opening on the old page 4.
function onUpdate(next: Record<string, unknown>): void {
  props.criteria.set({ filters: get(next, "filters", {}) });
}
</script>
