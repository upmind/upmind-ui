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
  toDataPathSegments
} from "@jsonforms/core";
import { useJsonFormsMultiEnumControl } from "@jsonforms/vue";
import { OptionTileGroup, OptionTile } from "@upmind/ui";
import { computed } from "vue";
import FormField from "../../FormField.vue";
import { useUpmindUIRenderer } from "../utils";
import { difference, forEach } from "lodash-es";
import type { ControlElement, JsonSchema } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// ----------------------------------------------
const props = defineProps<RendererProps<ControlElement>>();

const multiEnumControl = useJsonFormsMultiEnumControl(props);

/**
 * `useJsonFormsMultiEnumControl` dispatches via `addItem`/`removeItem` (one
 * value at a time) and never returns a `handleChange` — `useUpmindUIRenderer`
 * requires one, so this replays the tile group's whole-next-selection write
 * as the add/remove calls JSONForms' multi-enum control actually understands.
 *
 * @decision
 * what: `addItem`/`removeItem` are dispatched with the control's SCOPE
 * re-split into literal-key segments (`toDataPathSegments`), not with the
 * flattened `_path` string `useUpmindUIRenderer.onInput` hands in.
 * why: JSONForms' own `composeWithUi` builds that string by computing exactly
 * these segments and then `.join(".")`-ing them, which is where a schema
 * property with a literal dot in its name (`"status.code"`, `"category.slug"`
 * — this module's own filter-column names, per `invoices.schemas.ts`) becomes
 * indistinguishable from a real two-level nested path. `dispatch(update(path,
 * …))` resolves through `lodash/get` + `lodash/fp/set`, both of which treat an
 * ARRAY path's elements as literal keys (no split) — the same mechanism
 * `useModelParser`'s `set(result, [key], value)` fix already relies on
 * (2026-09-02 sign-off). JSONForms types `addItem`/`removeItem`'s `path` as
 * `string`, so the array is cast; the underlying dispatch never inspects the
 * type, only the runtime shape. Authorised: "Authorise the one-line client-vue
 * fix" (2026-09-09).
 * rejected: renaming the schema columns to drop the dot — `"status.code"` and
 * `"category.slug"` are the API's own filter-column names (oracle receipt),
 * not a naming choice this renderer controls.
 */
const handleChange = (_path: string, value: unknown) => {
  const next = Array.isArray(value) ? value : [];
  const current = Array.isArray(multiEnumControl.control.value.data)
    ? multiEnumControl.control.value.data
    : [];

  const literalPath = toDataPathSegments(
    multiEnumControl.control.value.uischema.scope
  ) as unknown as string;

  forEach(difference(next, current), item =>
    multiEnumControl.addItem(literalPath, item)
  );
  forEach(difference(current, next), item =>
    multiEnumControl.removeItem?.(literalPath, item)
  );
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
