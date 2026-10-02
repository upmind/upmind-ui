<template>
  <div
    v-if="loading && !items.length"
    role="status"
    :aria-label="t('text.loading')"
    :class="recordSection.items()"
    data-test-key="record-collection-loading"
  >
    <div
      v-for="index in SKELETON_ROWS"
      :key="index"
      :class="recordSection.skeletonRow()"
    >
      <Skeleton :class="recordSection.skeletonLabel()" />
      <Skeleton :class="recordSection.skeletonAction()" />
    </div>
  </div>
  <div v-else-if="items.length" :class="recordSection.items()">
    <Section
      v-for="item in items"
      :key="item.key"
      :value="item.key"
      :label="item.label"
      :icon="section.rowIcon"
      :card="false"
      :border="true"
      :data-attrs="{ 'data-test-key': `record-row-${item.key}` }"
    >
      <template v-if="item.actions.length" #actions>
        <Link
          v-for="action in item.actions"
          :key="action.name"
          :color="linkColor(action)"
          size="sm"
          :disabled="action.disabled || action.loading"
          :data-attrs="{ 'data-test-value': kebabCase(action.label) }"
          @click="action.onSelect"
        >
          <Spinner v-if="action.loading" size="xs" :label="t('text.loading')" />
          <Icon
            v-else-if="action.icon"
            :icon="action.icon"
            aria-hidden="true"
          />
          {{ action.label }}
        </Link>
      </template>

      <RecordFieldGrid
        v-if="section.row.length"
        :elements="section.row"
        :model="item.row"
      />
    </Section>
  </div>
  <span v-else :class="recordSection.none()">&mdash;</span>

  <div v-if="section.summary?.length" :class="recordSection.summary()">
    <template v-for="element in section.summary" :key="element.scope">
      <CellDispatcher
        v-if="isPopulated(element, model)"
        :element="element"
        :row="model"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/record/RecordCollectionSection
 * @description The `collection` section kind — each item at the section's
 * `scope` drawn as its own foundation `Section`: its `itemLabel` (given the
 * `rowTitle` as `{name}`) and `rowIcon` as the header, its row actions as
 * header links, its declared cells beneath in the record's description grid,
 * with an optional summary line under the whole collection. A scope addressing
 * one item draws it as a collection of one.
 */

import { Link, Skeleton, Spinner } from "@upmind/ui";
import { computed, unref } from "vue";
import { useI18n } from "vue-i18n";
import { Icon, Section } from "@upmind-automation/foundation";
import { resolveScope } from "../../../scenario.utils";
import { CellDispatcher } from "../../cells";
import { recordSection } from "./record.styles";
import { isPopulated, linkColor } from "./record.utils";
import RecordFieldGrid from "./RecordFieldGrid.vue";
import { castArray, find, get, isNil, kebabCase, map } from "lodash-es";
import type { RecordSectionProps } from "./record.types";
import type { RecordCollectionSection } from "../../../scenario.types";
// -----------------------------------------------------------------------------

const SKELETON_ROWS = 3;

const props = defineProps<RecordSectionProps<RecordCollectionSection>>();

const { t } = useI18n();

function labelOf(key: string, title: unknown): string {
  const name = isNil(title) || title === "" ? key : String(title);
  return props.section.itemLabel ? t(props.section.itemLabel, { name }) : name;
}

const items = computed(() => {
  const found = resolveScope(props.model, props.section.scope);
  const rows = (isNil(found) ? [] : castArray(found)) as Record<
    string,
    unknown
  >[];

  return map(rows, (row, index) => {
    const key = String(get(row, "id") ?? index);
    const title = find(
      map(castArray(props.section.rowTitle ?? []), scope =>
        unref(resolveScope(row, scope))
      ),
      value => !isNil(value) && value !== ""
    );
    return {
      key,
      row,
      label: labelOf(key, title),
      actions: props.bind(props.section.rowActions ?? [], row)
    };
  });
});
</script>
