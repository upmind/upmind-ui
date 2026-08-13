<template>
  <div
    v-if="!isEmpty(refinements)"
    role="group"
    :aria-label="t('labs.refinements')"
    :class="styles.refinementsRow.root"
    :aria-disabled="locked || undefined"
    :inert="locked || undefined"
    :title="locked ? t('labs.replay_locked') : undefined"
    data-test-key="refinements-row"
    :data-test-value="locked ? 'locked' : undefined"
  >
    <!-- The ui Badge's OWN close affordance (D9/P1-R14): a chip is a badge that
         can be taken off, so the × is the component's, never markup drawn
         beside it. -->
    <Badge
      v-for="refinement in refinements"
      :key="refinement.id"
      close
      size="sm"
      color="neutral"
      variant="muted"
      :label="refinement.label"
      :data-attrs="{
        'data-test-key': 'refinement',
        'data-test-value': refinement.id
      }"
      @close="remove(refinement)"
    />

    <Button
      size="sm"
      variant="ghost"
      color="neutral"
      :label="t('labs.clear_all')"
      :data-attrs="{ 'data-test-key': 'clear-all' }"
      @click="clearAll"
    />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/RefinementsRow
 * @description What the collection is narrowed BY right now — one removable
 * chip per active filter leaf, and Clear all. Nothing else (`G5`).
 *
 * The result count is deliberately absent: it moved to the display row's
 * Results label, because the count answers *what came back* and this row
 * answers *what was asked for* (`H1`). Clear all sits with the actions, ahead
 * of any meta — and after `H1` there is no meta in this row to sit ahead of.
 *
 * The chips are walked off the SCHEMA's declared `(column, operator)` pairs,
 * never the model's keys, so a leaf nobody declared can never reach one — the
 * same law the url serialisation holds, sharing its `declaredPairs`. The search
 * term is a filter leaf like any other (`filters.email.like` on this module), so
 * Clear all empties the narrowing and the search in one write with no second
 * vocabulary for either.
 *
 * It owns no state. Every write goes back through the composable's own merging
 * `set`, which is the same one the filter bar writes through, so the facets and
 * the chips can never disagree (`P1-R9`).
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Badge, Button, useStyles } from "@upmind-automation/upmind-ui";
import { declaredPairs } from "../composables/useCriteriaUrlSync.utils";
import config from "./RefinementsRow.styles";
import {
  find,
  get,
  isEmpty,
  isNil,
  isString,
  reduce,
  reject,
  set,
  toString
} from "lodash-es";
import type { Refinement, RefinementsRowProps } from "./RefinementsRow.types";
// -----------------------------------------------------------------------------

const props = defineProps<RefinementsRowProps>();

const { t } = useI18n();

/** The column's own declared sub-schema — where its title and its leaves live. */
function column(name: string): unknown {
  return get(props.criteria.schema, [
    "properties",
    "filters",
    "properties",
    name
  ]);
}

/**
 * What the chip says the leaf is set to — the DECLARED option's own title where
 * the schema names one, and the term itself where it does not: a free-text
 * value is the user's own words, so there is nothing to translate.
 */
function valueLabel(name: string, operator: string, value: unknown): string {
  const declared = find(
    get(column(name), ["properties", operator, "oneOf"], []),
    option => get(option, "const") === value
  );
  const title = get(declared, "title");
  return isString(title) ? t(title) : toString(value);
}

/**
 * Every active narrowing, in declaration order. A leaf is active when it
 * carries a value the WIRE would carry — `criteriaToParams` drops nil and empty
 * at exactly this test, so a chip appears iff the request is actually narrowed.
 */
const refinements = computed<Refinement[]>(() =>
  reduce(
    declaredPairs(props.criteria.schema),
    (active: Refinement[], [name, operator]) => {
      const value = get(props.criteria.model.value, [
        "filters",
        name,
        operator
      ]);
      if (isNil(value) || value === "") return active;

      const title = get(column(name), "title");

      active.push({
        id: `${name}.${operator}`,
        column: name,
        operator,
        value,
        label: t("labs.refinement", {
          label: isString(title) ? t(title) : name,
          value: valueLabel(name, operator, value)
        })
      });
      return active;
    },
    []
  )
);

// `set` merges at BRANCH level — it replaces `filters` whole — so taking one
// chip off means writing every OTHER active leaf back, never a delete against
// the live model.
function remove(dropped: Refinement): void {
  props.criteria.set({
    filters: reduce(
      reject(refinements.value, { id: dropped.id }),
      (next: Record<string, unknown>, refinement) => {
        set(next, [refinement.column, refinement.operator], refinement.value);
        return next;
      },
      {}
    )
  });
}

function clearAll(): void {
  props.criteria.set({ filters: {} });
}

const styles = useStyles(["refinementsRow"], {}, config);
</script>
