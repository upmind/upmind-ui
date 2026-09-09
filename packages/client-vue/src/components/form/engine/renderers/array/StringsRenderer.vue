<template>
  <FormField v-bind="formFieldProps">
    <OptionTileGroup
      mode="multiple"
      :model-value="control.data"
      @update:model-value="onInput"
    >
      <OptionTile
        v-for="item in items"
        :key="String(item.value)"
        :value="item.value"
        :label="item.label"
      />
    </OptionTileGroup>
  </FormField>
</template>

<script lang="ts" setup>
import {
  uiTypeIs,
  and,
  schemaMatches,
  hasType,
  schemaSubPathMatches,
  toDataPathSegments,
  update
} from "@jsonforms/core";
import { useJsonFormsMultiEnumControl } from "@jsonforms/vue";
import { OptionTileGroup, OptionTile } from "@upmind/ui";
import { computed, inject } from "vue";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import type {
  ControlElement,
  CoreActions,
  Dispatch,
  JsonSchema
} from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const multiEnumControl = useJsonFormsMultiEnumControl(props);
const dispatch = inject<Dispatch<CoreActions>>("dispatch");

/**
 * `useJsonFormsMultiEnumControl` dispatches via `addItem`/`removeItem` (one
 * value at a time) and never returns a `handleChange` — `useUpmindUIRenderer`
 * requires one, so this replays the tile group's whole-next-selection write
 * directly, through the same `dispatch(update(path, updater))` primitive
 * `addItem`/`removeItem` are themselves built on.
 *
 * @decision
 * what: the whole `next` selection is dispatched as ONE literal-path `update`
 * whose updater returns `next` outright, replacing the per-item add/remove-
 * by-diff (diffed against `multiEnumControl.control.value.data`) a prior
 * cycle of this fix used.
 * why: `control.value.data` is resolved entirely inside `@jsonforms/core`'s
 * `mapStateToControlProps` via `Resolve.data(rootData, composeWithUi(uischema,
 * path))` (`@jsonforms/core` `src/mappers/renderer.ts`). `composeWithUi`
 * re-JOINS the scope's segments with "." (`src/util/uischema.ts`,
 * `src/util/path.ts`), and `Resolve.data`'s `resolveData` then SPLITS that
 * joined string back on "." (`src/util/resolvers.ts`) — so a schema property
 * with a literal dot in its name (`"status.code"`, `"category.slug"` — this
 * module's own filter-column names, per `invoices.schemas.ts`) is walked as
 * TWO nested keys that do not exist (`data.filters.status.code` instead of
 * `data.filters["status.code"]`), and `control.value.data` resolves to
 * `undefined` — PERMANENTLY, not merely stale. Diffing `next` against a
 * permanently-empty `current` treats every already-selected item as new on
 * every write (`difference(next, []) === next`) and never computes a removal
 * (`difference([], next) === []`) — exactly the "click A / click B / click A
 * again" duplicate-with-no-removal sequence this cycle reproduces. There is
 * no literal-path fix for the READ the way `toDataPathSegments` fixed the
 * WRITE: `control.value.data`'s resolution happens entirely inside
 * `@jsonforms/core`, not at this renderer's own call site. Dispatching the
 * whole next selection sidesteps the read altogether: `dispatch(update(path,
 * updater))` is the same primitive `mapDispatchToMultiEnumProps`'s own
 * `addItem`/`removeItem` are built on (`@jsonforms/core`
 * `mapDispatchToMultiEnumProps`, `src/reducers/core.ts`'s `UPDATE_DATA` case),
 * so supplying an updater that returns `next` outright is faithful to that
 * same dispatch mechanism, and is immune to the read-side bug because it never
 * reads `current`. The literal-path array (`toDataPathSegments`, cast to
 * `string` — `update`'s `path` is typed `string`, but the reducer resolves it
 * through `lodash/get` + `lodash/fp/set`, both of which treat an array path's
 * elements as literal keys, no split) is unchanged from the prior cycle's
 * authorised write fix. Authorised: "Authorise the one-line client-vue fix"
 * (2026-09-09).
 * rejected: reading `current` via a hand-rolled `get(coreData,
 * literalPathSegments)` against the raw injected `jsonforms` state — viable,
 * but keeping two literal-path resolutions (one for read, one for write) where
 * a single dispatch call already suffices is the more fragile shape.
 * rejected: renaming the schema columns to drop the dot — `"status.code"` and
 * `"category.slug"` are the API's own filter-column names (oracle receipt),
 * not a naming choice this renderer controls.
 */
const handleChange = (_path: string, value: unknown) => {
  const next = Array.isArray(value) ? value : [];

  const literalPath = toDataPathSegments(
    multiEnumControl.control.value.uischema.scope
  ) as unknown as string;

  dispatch?.(update(literalPath, () => next));
};

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer({
    ...multiEnumControl,
    handleChange
  });

const items = computed(
  () => appliedOptions.value?.items ?? control.value.options ?? []
);
</script>

<script lang="ts">
const hasOneOfItems = (schema: JsonSchema) =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every((entry: JsonSchema) => {
    return entry.const !== undefined;
  });

const hasEnumItems = (schema: JsonSchema) =>
  schema.type === "string" && schema.enum !== undefined;

export const tester = {
  rank: 5,
  controlType: and(
    uiTypeIs("Control"),
    and(
      schemaMatches(
        schema =>
          hasType(schema, "array") &&
          !Array.isArray(schema.items) &&
          schema.uniqueItems === true
      ),
      schemaSubPathMatches("items", schema => {
        return hasOneOfItems(schema) || hasEnumItems(schema);
      })
    )
  )
};
</script>
