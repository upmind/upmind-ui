<template>
  <div
    class="space-y-1"
    data-test-key="debug-pane"
    :data-test-value="section.name"
  >
    <section v-if="section.scope" data-test-key="debug-scope">
      <header class="border-surface relative mb-3 border-b pt-3 pb-1">
        <h2 class="text-display text-sm font-bold">
          {{ t("labs.debug_scope") }}
        </h2>
      </header>

      <div class="flex flex-wrap gap-2">
        <Badge
          appearance="solid"
          size="sm"
          color="primary"
          :label="t(ACTOR_LABEL_KEYS[section.scope.actor])"
        />
      </div>

      <Collapsible class="mt-3">
        <CollapsibleTrigger as-child>
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            :label="t('labs.debug_matrix')"
            class="text-muted hover:text-display cursor-pointer text-xs font-semibold tracking-wider uppercase transition-colors"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div class="mt-2 space-y-1">
            <div
              v-for="(contexts, actor) in section.scope.matrix"
              :key="actor"
              class="flex items-center gap-2 text-xs"
              data-test-key="debug-matrix-row"
              :data-test-value="actor"
            >
              <span class="text-muted min-w-16 font-medium">
                {{ t(ACTOR_LABEL_KEYS[actor]) }}
              </span>
              <span class="text-faint">→</span>
              <span>{{ matrixContexts(contexts) }}</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>

    <section
      v-if="stateSegments.length || errorCount"
      data-test-key="debug-state"
    >
      <header class="border-surface relative mb-3 border-b pt-3 pb-1">
        <h2 class="text-display text-sm font-bold">
          {{ t("labs.debug_state") }}
        </h2>
      </header>

      <div class="flex flex-wrap gap-2">
        <Badge
          v-for="(segment, index) in stateSegments"
          :key="index"
          appearance="solid"
          color="promo"
          size="sm"
          :label="segment"
        />

        <Collapsible
          v-if="errorCount"
          class="mt-3"
          data-test-key="debug-errors"
        >
          <CollapsibleTrigger as-child>
            <Badge
              appearance="solid"
              size="sm"
              color="danger"
              class="cursor-pointer"
              :label="t('labs.debug_errors', errorCount)"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre
              class="bg-accent-danger-muted text-accent-danger mt-2 max-h-48 w-full overflow-auto rounded-lg p-3 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap"
              >{{ errorDetail }}</pre
            >
          </CollapsibleContent>
        </Collapsible>
      </div>
    </section>

    <MetaPanel v-if="!isEmpty(metaFlags)" :meta="metaFlags" />

    <ContextPanel v-if="!isEmpty(contextValues)" :context="contextValues" />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module sheets/DebugPane
 * @description The Debug view of ONE registered section — the Inspector's whole
 * body, unchanged in what it shows (`AC3.2`): the cell's scope and the matrix it
 * resolves against, its state path, its errors, its meta flags and its context.
 *
 * It draws a section it is HANDED rather than reading the registry itself, so
 * the host owns which section is on screen (the `tab=` url value) and the pane
 * owns only how one is drawn.
 *
 * Meta and context are the landed `MetaPanel` / `ContextPanel` — the two
 * generalisations of these very sections — so a flag's colour and a context
 * entry's collapsible are defined once for the pane and the scenario runtime
 * alike. What this pane still owns is what those two do not model: the scope
 * matrix and the state path.
 */

import { computed, unref } from "vue";
import { useI18n } from "vue-i18n";
import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@upmind/ui";
import ContextPanel from "../../../modules/scenarios/runtime/components/ContextPanel.vue";
import MetaPanel from "../../../modules/scenarios/runtime/components/MetaPanel.vue";
import { ACTOR_LABEL_KEYS } from "../scope/useActorScopeSelector";
import {
  entries,
  flatMap,
  isArray,
  isEmpty,
  isNil,
  isObject,
  isString,
  join,
  map,
  reduce,
  size,
  split,
  startCase
} from "lodash-es";
import type { DebugPaneProps } from "./DebugPane.types";
import type { ContextItem } from "./usePlaygroundSheet.types";
// -----------------------------------------------------------------------------

const props = defineProps<DebugPaneProps>();

const { t } = useI18n();

/** A state path or a parallel-state object, as the segments a reader scans. */
const stateSegments = computed<string[]>(() => {
  const state = props.section.state;
  if (!state) return [];
  if (isString(state)) return map(split(state, "."), startCase);
  if (isObject(state) && !isArray(state)) {
    return flatMap(entries(state as Record<string, unknown>), ([key, value]) =>
      isString(value)
        ? [`${startCase(key)}: ${startCase(value)}`]
        : [startCase(key)]
    );
  }

  return [String(state)];
});

const errorCount = computed(() => {
  const errors = props.section.errors;
  if (!errors) return 0;
  if (isArray(errors)) return size(errors);
  if (isObject(errors) && "details" in errors && isArray(errors.details)) {
    return size(errors.details);
  }

  return 1;
});

const errorDetail = computed(() =>
  props.section.errors ? JSON.stringify(props.section.errors, null, 2) : ""
);

/** `MetaPanel`'s contract is plain booleans, so every flag is unwrapped here. */
const metaFlags = computed<Record<string, boolean>>(() =>
  reduce(
    entries(props.section.meta ?? {}),
    (flags, [key, value]) => {
      const resolved = unref(value);
      if (resolved !== undefined) flags[key] = resolved;
      return flags;
    },
    {} as Record<string, boolean>
  )
);

/**
 * `ContextPanel`'s contract is a plain record, so an entry that named its own
 * emptiness rule is resolved to its value here — and dropped while that value
 * is empty, which is what `hideIfEmpty` asks for.
 */
const contextValues = computed<Record<string, unknown>>(() =>
  reduce(
    entries(props.section.context ?? {}),
    (values, [key, entry]) => {
      const item = entry as ContextItem;
      const isItem = isObject(entry) && "value" in (entry as object);
      const value = isItem ? item.value : entry;
      const isHidden =
        isItem && item.hideIfEmpty && (isNil(value) || value === "");
      if (!isHidden) values[key] = value;
      return values;
    },
    {} as Record<string, unknown>
  )
);

function matrixContexts(contexts: unknown): string {
  if (!contexts) return "—";
  if (isArray(contexts)) return join(map(contexts, startCase), ", ");

  return startCase(String(contexts));
}
</script>
