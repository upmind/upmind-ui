<template>
  <div
    class="space-y-4"
    data-test-key="debug-pane"
    :data-test-value="section.name"
  >
    <section
      v-if="stateSegments.length || errorCount"
      class="flex flex-col gap-3"
      data-test-key="debug-state"
    >
      <Heading :level="2" class="text-sm">{{ t("labs.debug_state") }}</Heading>

      <div class="flex flex-wrap gap-2">
        <Badge
          v-for="(segment, index) in stateSegments"
          :key="index"
          appearance="muted"
          variant="promo"
          size="sm"
        >
          {{ segment }}
        </Badge>
      </div>

      <Collapsible v-if="errorCount" data-test-key="debug-errors">
        <template #trigger>
          <Button variant="danger" size="xs">
            <Icon icon="alert-circle" size="xs" />
            {{ t("labs.debug_errors", errorCount) }}
          </Button>
        </template>

        <CodeBlock
          class="mt-2"
          :code="errorDetail"
          lang="json"
          :line-numbers="false"
        />
      </Collapsible>
    </section>

    <section
      v-if="section.scope"
      class="flex flex-col gap-3"
      data-test-key="debug-scope"
    >
      <Heading :level="2" class="text-sm">{{ t("labs.debug_scope") }}</Heading>

      <div class="flex flex-wrap gap-2">
        <Badge appearance="muted" size="sm" variant="primary">
          {{ t(ACTOR_LABEL_KEYS[section.scope.actor]) }}
        </Badge>
      </div>

      <Collapsible>
        <template #trigger>
          <Button variant="ghost" size="xs">
            {{ t("labs.debug_matrix") }}
            <Icon icon="chevron-down" size="nano" />
          </Button>
        </template>

        <DescriptionList
          class="mt-2"
          size="sm"
          :items="matrixRows"
          :data-attrs="{ 'data-test-key': 'debug-matrix' }"
        />
      </Collapsible>
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

import {
  Badge,
  Button,
  Collapsible,
  DescriptionList,
  Heading
} from "@upmind/ui";
import { computed, unref } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";
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
  isPlainObject,
  isString,
  join,
  map,
  mapValues,
  reduce,
  size,
  split,
  startCase
} from "lodash-es";
import type { DebugPaneProps } from "./DebugPane.types";
import type { ContextItem } from "./usePlaygroundSheet.types";
import type { DescriptionListOption } from "@upmind/ui";
import { CodeBlock } from "~/components/code";
// -----------------------------------------------------------------------------

/** What a credential reads as once the pane has taken it out. */
const REDACTED = "[redacted]";

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
 * Anything whose NAME says it is a bearer credential. The session sections dump
 * whole session records, live and pooled, so the secret is nested arbitrarily
 * deep — the debug pane shows that a token is present, never what it is.
 */
const SECRET_KEY = /(token|secret|password|api[-_]?key)/i;

/** Every credential replaced by a marker, at any depth, structure untouched. */
function redact(value: unknown): unknown {
  if (isArray(value)) return map(value, redact);
  if (!isPlainObject(value)) return value;

  return mapValues(value as Record<string, unknown>, (nested, key) =>
    SECRET_KEY.test(key) && !isNil(nested) ? REDACTED : redact(nested)
  );
}

/**
 * `ContextPanel`'s contract is a plain record, so an entry that named its own
 * emptiness rule is resolved to its value here — and dropped while that value
 * is empty, which is what `hideIfEmpty` asks for.
 *
 * Credentials are redacted on the way through: a debug pane is a reading
 * surface, and a session's `access_token` rendered raw is a live bearer token
 * on screen for anyone over the operator's shoulder.
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
      if (!isHidden)
        values[key] = SECRET_KEY.test(key) ? REDACTED : redact(value);
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

/** The matrix as rows: actor → the contexts it resolves. */
const matrixRows = computed<DescriptionListOption[]>(() =>
  map(entries(props.section.scope?.matrix ?? {}), ([actor, contexts]) => ({
    term: t(ACTOR_LABEL_KEYS[actor as keyof typeof ACTOR_LABEL_KEYS]),
    description: matrixContexts(contexts),
    dataAttrs: { "data-test-key": "debug-matrix-row", "data-test-value": actor }
  }))
);
</script>
