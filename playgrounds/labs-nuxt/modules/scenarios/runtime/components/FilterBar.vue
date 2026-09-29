<template>
  <Form
    :schema="schema"
    :uischema="uischema"
    :model-value="model"
    :disabled="disabled"
    :data-attrs="{ 'data-test-key': 'filters' }"
    size="sm"
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
import { Form } from "@upmind-automation/foundation";
import { assign, get, has, isEmpty } from "lodash-es";
import type { FilterBarProps } from "./FilterBar.types";
import type { FormProps } from "@upmind-automation/client-vue";
// -----------------------------------------------------------------------------

const props = defineProps<FilterBarProps>();

const schema = computed(() => props.criteria.schema as FormProps["schema"]);
const uischema = computed(
  () => props.criteria.uischema as FormProps["uischema"]
);
const model = computed(() => props.criteria.model.value);

/**
 * True when the module's own query schema declares the top-level `query`
 * branch — the platform quick-search, which is NOT a filter and so never
 * appears under `filters`. Read off the schema rather than assumed, so a
 * collection that declares none is written back exactly as before.
 */
const hasQueryBranch = computed(() =>
  has(props.criteria.schema as Record<string, unknown>, ["properties", "query"])
);

// The `filters` branch is written back, and the top-level `query` branch beside
// it where the schema declares one. `setCriteria` merges at BRANCH level and
// returns the cursor to the first page for a write that does not carry its own
// `pagination` — handing it the whole parsed model would carry the live
// `pagination` and silently suppress that reset, leaving a new filter set
// opening on the old page 4. `query` is named explicitly for the same reason:
// it is a declared criteria branch a control can scope (`tickets.schemas.ts`'s
// search box does), and a bar that forwarded only `filters` dropped every
// keystroke typed into it — the box looked live and narrowed nothing.
function onUpdate(next: Record<string, unknown>): void {
  // An emptied box is NULL, never `""`: the branch is declared
  // `["string", "null"]` with a minimum length, so re-sending the empty string
  // would be rejected as too short instead of read as "no search".
  const query = get(next, "query");
  props.criteria.set(
    assign(
      { filters: get(next, "filters", {}) },
      hasQueryBranch.value ? { query: isEmpty(query) ? null : query } : {}
    )
  );
}
</script>
