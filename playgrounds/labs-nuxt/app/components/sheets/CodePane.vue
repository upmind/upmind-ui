<template>
  <section :class="styles.codePane.root" data-test-key="code-pane">
    <div :class="styles.codePane.toolbar">
      <h2 :class="styles.codePane.title">{{ heading }}</h2>

      <Tooltip :label="copyLabel">
        <Button
          icon-only
          size="sm"
          variant="ghost"
          color="neutral"
          :icon="copied ? 'check' : 'copy-01'"
          :label="copyLabel"
          :aria-label="copyLabel"
          :data-attrs="{ 'data-test-key': 'code-copy' }"
          @click="copy(snippet)"
        />
      </Tooltip>
    </div>

    <Markdown :model-value="fence" :class="styles.codePane.snippet" />
  </section>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module sheets/CodePane
 * @description The call that reproduces what is on screen — this page's own
 * SFC-equivalent call with the live state inlined, and one click to take it
 * away (`AC3.3`, `D1`). Code is a PAGE feature, not debug tooling: it answers
 * "how do I get this?", which is why it is a sheet of its own beside Debug
 * rather than a section inside it (`S22`, `G14 refined`).
 *
 * It NEVER prints harness or step-runner code (`R7-6`, correcting `R6-20`). The
 * reader is a developer copying the call into their own app, so what a scenario
 * did to reach this state is beside the point — the call that REPRODUCES the
 * state is the answer, armed or live. A scene moves the criteria this reads, so
 * arriving at a stop rewrites the snippet by itself.
 *
 * The fence is a COMPUTED over the same criteria the filter bar writes, so
 * changing a facet updates the snippet with nothing reloaded and nothing
 * refetched — the pane holds no copy of the request state and no snapshot of
 * it.
 *
 * What it prints is the real four-layer surface: the scoped builder, `.as()`
 * and the `.for()` step the url's acting-for segment supplies, the context and
 * actions layers, and the module's own `filterBy` / `sortBy` intents — never a
 * parallel shape invented for display. An enum VALUE prints as the member a
 * reader would have typed, so the snippet obeys the same law as the code around
 * it.
 *
 * The block is drawn by the real `Markdown.ce.vue` (`P1-R14`) and copied
 * through VueUse's own clipboard, so what lands on the clipboard is exactly
 * what is on screen.
 */

import { useClipboard } from "@vueuse/core";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ScopeActorTypes, SortDirection } from "@upmind-automation/headless";
import {
  Button,
  Markdown,
  Tooltip,
  useStyles
} from "@upmind-automation/upmind-ui";
import config from "./CodePane.styles";
import {
  camelCase,
  compact,
  entries,
  findKey,
  get,
  isArray,
  isEmpty,
  isNil,
  isPlainObject,
  join,
  map,
  mapValues,
  omitBy,
  replace
} from "lodash-es";
import type { CodePaneProps } from "./CodePane.types";
import type { QuerySortEntry } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const props = defineProps<CodePaneProps>();

const { t } = useI18n();

// `legacy: true` keeps the control honest where the async Clipboard API is not
// there to reach (an insecure origin, an older browser) — the house pattern,
// `client-vue`'s `Share.vue`.
const { copy, copied } = useClipboard({ legacy: true });

const copyLabel = computed(() =>
  copied.value ? t("confirm.copied") : t("labs.code_copy")
);

// --- The live state the call carries

const model = computed<Record<string, unknown>>(
  () => props.criteria?.model.value ?? {}
);

/**
 * The narrowing, minus every inactive leaf — the same nil/empty rule the
 * criteria's own url serialisation drops on, so the fence and the link a
 * colleague is sent agree about what is narrowing the collection.
 */
const filters = computed(() =>
  omitBy(
    mapValues(
      get(model.value, "filters", {}) as Record<
        string,
        Record<string, unknown>
      >,
      column => omitBy(column, value => isNil(value) || value === "")
    ),
    isEmpty
  )
);

const orderings = computed(
  () => get(model.value, "sort", []) as QuerySortEntry[]
);

// --- The call itself

const identifierKey = /^[A-Za-z_$][\w$]*$/;

/** A live value as the TypeScript literal a reader would have typed. */
function literal(value: unknown): string {
  if (isNil(value)) return String(value);
  if (isArray(value)) return `[${join(map(value, literal), ", ")}]`;
  if (isPlainObject(value))
    return `{ ${join(
      map(
        entries(value as object),
        ([key, nested]) =>
          `${identifierKey.test(key) ? key : JSON.stringify(key)}: ${literal(nested)}`
      ),
      ", "
    )} }`;
  return JSON.stringify(value);
}

/** An enum VALUE as its member — a snippet obeys the enum law it demonstrates. */
function member(name: string, source: object, value: unknown): string {
  const key = findKey(source, entry => entry === value);
  return key ? `${name}.${key}` : literal(value);
}

const handle = computed(() => camelCase(replace(props.name, /^use/, "")));

const scoped = computed(() => {
  const actor = member("ScopeActorTypes", ScopeActorTypes, props.scope.actor);
  const acting = props.scope.context;

  return acting
    ? [
        `const ${handle.value} = ${props.name}()`,
        `  .as(${actor})`,
        `  .for(${literal(acting.type)}, ${literal(acting.id)});`
      ]
    : [`const ${handle.value} = ${props.name}().as(${actor});`];
});

const imported = computed(() =>
  compact([
    "ScopeActorTypes",
    isEmpty(orderings.value) ? undefined : "SortDirection",
    props.name
  ])
);

const actions = computed(() =>
  compact([
    isEmpty(filters.value) ? undefined : "filterBy",
    "isReady",
    isEmpty(orderings.value) ? undefined : "sortBy"
  ])
);

const writes = computed(() =>
  compact([
    isEmpty(filters.value) ? undefined : `filterBy(${literal(filters.value)});`,
    isEmpty(orderings.value)
      ? undefined
      : `sortBy([${join(
          map(
            orderings.value,
            entry =>
              `{ field: ${literal(entry.field)}, dir: ${member("SortDirection", SortDirection, entry.dir)} }`
          ),
          ", "
        )}]);`
  ])
);

// A literal closing script tag inside an SFC's own script block ends it at
// parse time, so the tag the fence prints is assembled rather than typed.
const scriptTag = "script";

const snippet = computed(() =>
  join(
    [
      `<${scriptTag} lang="ts" setup>`,
      `import { ${join(imported.value, ", ")} } from "@upmind-automation/headless";`,
      "",
      ...scoped.value,
      "",
      props.criteria
        ? `const { data, pagination } = ${handle.value}.useContext();`
        : `const context = ${handle.value}.useContext();`,
      `const { ${join(actions.value, ", ")} } = ${handle.value}.useActions();`,
      "",
      "await isReady();",
      ...(isEmpty(writes.value) ? [] : ["", ...writes.value]),
      `</${scriptTag}>`
    ],
    "\n"
  )
);

const heading = computed(() => t("labs.sheet_code"));

const fence = computed(() => `\`\`\`vue\n${snippet.value}\n\`\`\``);

const styles = useStyles(["codePane"], {}, config);
</script>
