<template>
  <div
    v-if="!isEmpty(refinements)"
    role="group"
    :aria-label="t('labs.refinements')"
    :class="refinementsRow.root()"
    :aria-disabled="locked || undefined"
    :inert="locked || undefined"
    :title="locked ? t('labs.replay_locked') : undefined"
    data-test-key="refinements-row"
    :data-test-value="locked ? 'locked' : undefined"
  >
    <!-- The chip IS the remove control, so the Badge lends its coat to a Button
         rather than parking a second control beside it: the states are the
         Button's own. This SUPERSEDES `D9`/`P1-R14` — the Badge's own
         `removeLabel` route — by operator ruling: `removeLabel` draws a second
         control inside the chip, and the chip is the control.

         The accessible name NAMES the refinement. A bare `action.remove`
         aria-label overrides the visible content, so every chip in the row
         announced the same word and none of them said what it would drop. -->
    <Badge
      v-for="refinement in refinements"
      :key="refinement.id"
      as-child
      variant="promo"
      size="sm"
    >
      <Button
        variant="ghost"
        size="xs"
        :class="refinementsRow.chip()"
        :aria-label="t('action.remove_value', { value: refinement.label })"
        :data-attrs="{
          'data-test-key': 'refinement',
          'data-test-value': refinement.id
        }"
        @click="remove(refinement)"
      >
        {{ refinement.label }}
        <Icon icon="x-close" size="nano" aria-hidden="true" />
      </Button>
    </Badge>

    <Link
      color="inherit"
      size="sm"
      :data-attrs="{
        'data-test-key': 'clear-all',
        'data-test-value': 'clear-all'
      }"
      @click="clearAll"
    >
      {{ t("labs.clear_all") }}
    </Link>
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

import { enumToEnumOptionMapper, toDataPath } from "@jsonforms/core";
import { Badge, Button, Link } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";
import { useFormI18n } from "@upmind-automation/client-vue";
import { declaredPairs } from "../composables/useCriteriaUrlSync.utils";
import { refinementsRow } from "./RefinementsRow.styles";
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

const i18n = useFormI18n();

/** The column's own declared sub-schema — where its title and its leaves live. */
function column(name: string): unknown {
  return get(props.criteria.schema, [
    "properties",
    "filters",
    "properties",
    name
  ]);
}

/** The leaf's own filter-bar element — where its `i18n` key PREFIX lives. */
function element(name: string, operator: string): unknown {
  return find(
    get(props.criteria.uischema, "elements", []),
    candidate =>
      toDataPath(get(candidate, "scope", "")) === `filters.${name}.${operator}`
  );
}

/**
 * What the chip says the leaf is set to. A leaf declaring a SET resolves through
 * its element's `i18n` prefix as `<i18n>.<value>` — core's own mapper, the one
 * the sort options are named by — so a tri-state's `false` reads as its declared
 * position and never as a raw boolean. The prefix is the ONLY source: i18n keys
 * never live in the schema (`client-email.schemas.ts`). A leaf declaring no set
 * is free text — the user's own words, so there is nothing to translate.
 */
function valueLabel(name: string, operator: string, value: unknown): string {
  const declared = get(column(name), ["properties", operator, "enum"]);
  const prefix = get(element(name, operator), "i18n");

  if (isEmpty(declared) || !isString(prefix)) return toString(value);

  return enumToEnumOptionMapper(value, i18n.value.translate, prefix).label;
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
</script>
