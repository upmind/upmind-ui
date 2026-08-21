<template>
  <div
    :class="styles.debugPane.root"
    data-test-key="debug-pane"
    :data-test-value="section.name"
  >
    <section
      v-if="section.scope"
      :class="styles.debugPane.section"
      data-test-key="debug-scope"
    >
      <header :class="styles.debugPane.header">
        <h2 :class="styles.debugPane.title">{{ t("labs.debug_scope") }}</h2>
      </header>

      <div :class="styles.debugPane.badges">
        <Badge
          variant="solid"
          size="sm"
          color="primary"
          :label="t(ACTOR_LABEL_KEYS[section.scope.actor])"
        />
      </div>

      <Collapsible :class="styles.debugPane.collapsible">
        <CollapsibleTrigger as-child>
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            :label="t('labs.debug_matrix')"
            :class="styles.debugPane.trigger"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div :class="styles.debugPane.matrix">
            <div
              v-for="(contexts, actor) in section.scope.matrix"
              :key="actor"
              :class="styles.debugPane.matrixRow"
              data-test-key="debug-matrix-row"
              :data-test-value="actor"
            >
              <span :class="styles.debugPane.matrixActor">
                {{ t(ACTOR_LABEL_KEYS[actor]) }}
              </span>
              <span :class="styles.debugPane.matrixArrow">→</span>
              <span :class="styles.debugPane.matrixContexts">
                {{ matrixContexts(contexts) }}
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>

    <section
      v-if="stateSegments.length || errorCount"
      :class="styles.debugPane.section"
      data-test-key="debug-state"
    >
      <header :class="styles.debugPane.header">
        <h2 :class="styles.debugPane.title">{{ t("labs.debug_state") }}</h2>
      </header>

      <div :class="styles.debugPane.badges">
        <Badge
          v-for="(segment, index) in stateSegments"
          :key="index"
          variant="solid"
          color="promo"
          size="sm"
          :label="segment"
        />

        <Collapsible
          v-if="errorCount"
          :class="styles.debugPane.collapsible"
          data-test-key="debug-errors"
        >
          <CollapsibleTrigger as-child>
            <Badge
              variant="solid"
              size="sm"
              color="danger"
              :class="styles.debugPane.errors"
              :label="t('labs.debug_errors', errorCount)"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre :class="styles.debugPane.errorPre">{{ errorDetail }}</pre>
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
  CollapsibleTrigger,
  useStyles
} from "@upmind-automation/upmind-ui";
import ContextPanel from "../../../modules/scenarios/runtime/components/ContextPanel.vue";
import MetaPanel from "../../../modules/scenarios/runtime/components/MetaPanel.vue";
import { ACTOR_LABEL_KEYS } from "../scope/useActorScopeSelector";
import config from "./sheets.styles";
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

const styles = useStyles(["debugPane"], {}, config);
</script>
