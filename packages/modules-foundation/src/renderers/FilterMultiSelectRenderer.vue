<template>
  <FormField v-bind="formFieldProps">
    <DropdownMenuRoot v-model:open="isOpen">
      <DropdownMenuTrigger as-child>
        <Button
          size="sm"
          variant="outline"
          :aria-expanded="isOpen"
          :disabled="!control.enabled"
          :data-attrs="{
            'data-test-key': 'filter-multi-select',
            'data-test-value': control.path
          }"
        >
          <span class="truncate">{{ triggerLabel }}</span>
          <Icon icon="chevron-down" size="nano" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" :class="filterMultiSelect.content()">
        <DropdownMenuLabel>{{ control.label }}</DropdownMenuLabel>
        <!-- `select` is prevented so the menu stays open: narrowing a facet is
             several choices, and a menu that closes on each one makes the user
             re-open it per value. -->
        <DropdownMenuCheckboxItem
          v-for="item in items"
          :key="String(item.value)"
          data-test-key="option-tile"
          :data-test-value="String(item.value)"
          :model-value="includes(selected, item.value)"
          @select="onSelect(item.value, $event)"
        >
          {{ item.label }}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  </FormField>
</template>

<script lang="ts" setup>
import {
  and,
  optionIs,
  schemaMatches,
  hasType,
  schemaSubPathMatches,
  toDataPathSegments,
  update
} from "@jsonforms/core";
import { useJsonFormsMultiEnumControl } from "@jsonforms/vue";
import {
  Button,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  FormField,
  useUpmindUIRenderer
} from "@upmind/ui";
import { computed, inject, ref } from "vue";
import { Icon } from "../icon";
import { filterMultiSelect } from "./FilterMultiSelectRenderer.styles";
import { get, includes, isEmpty, size, without } from "lodash-es";
import type {
  ControlElement,
  CoreActions,
  Dispatch,
  JsonFormsSubStates,
  JsonSchema
} from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
// -----------------------------------------------------------------------------
/**
 * @module renderers/FilterMultiSelectRenderer
 * @description A multi-enum filter leaf (`array` + `uniqueItems` + `items.oneOf`)
 * as a COMPACT checkable menu — the filter bar's form of the same choice the
 * ui package's `StringsRenderer` draws as an expanded tile stack.
 *
 * A bar is a row of controls, and a tile stack is not one: a vocabulary of
 * eleven statuses draws eleven full-width rows, which is taller than the table
 * it filters and, because a flex item's `min-width` is `auto`, wider than the
 * bar — so it overflows its neighbours instead of wrapping beside them. The
 * menu states the facet's name and its live count on ONE control and moves the
 * vocabulary into a panel that scrolls, which is the same object the column
 * picker already is.
 *
 * @decision
 * what: the whole next selection is dispatched as ONE literal-path `update`
 * whose updater returns it outright, and the live selection is READ by the
 * same literal path off the injected core data.
 * why: `useJsonFormsMultiEnumControl` dispatches via `addItem`/`removeItem`
 * (one value at a time) and never returns a `handleChange`. Worse, this
 * module's own filter columns carry a literal dot in their names
 * (`"status.code"`, `"category.slug"` — the API's names, not a choice this
 * renderer makes), and `control.value.data` is resolved inside
 * `@jsonforms/core` by joining the scope on "." and splitting it again
 * (`composeWithUi` + `Resolve.data`), so a dotted property is walked as two
 * nested keys that do not exist and the read resolves to `undefined`
 * PERMANENTLY. Both sides therefore bypass `control.value.data`: the write
 * dispatches the whole next array through the same `update` primitive
 * `addItem`/`removeItem` are built on, and the read resolves the literal path
 * itself. `toDataPathSegments` is cast to `string` because `update`'s `path`
 * is typed so, while the reducer resolves it through lodash `get`/`set`, both
 * of which treat an array path's elements as literal keys with no split.
 * rejected: reading `control.value.data` and diffing — it is permanently
 * empty for a dotted column, so every write re-adds what is already selected
 * and never computes a removal (the "click A, click B, click A again"
 * duplicate-with-no-removal sequence).
 */

const props = defineProps<RendererProps<ControlElement>>();

const multiEnumControl = useJsonFormsMultiEnumControl(props);
const dispatch = inject<Dispatch<CoreActions>>("dispatch");
const jsonforms = inject<JsonFormsSubStates>("jsonforms");

const isOpen = ref(false);

/** The leaf's own literal path — the dotted column name as ONE segment. */
const literalPath = computed(() =>
  toDataPathSegments(multiEnumControl.control.value.uischema.scope)
);

const handleChange = (_path: string, value: unknown) => {
  const next = Array.isArray(value) ? value : [];

  dispatch?.(update(literalPath.value as unknown as string, () => next));
};

const { control, appliedOptions, formFieldProps } = useUpmindUIRenderer({
  ...multiEnumControl,
  handleChange
});

const items = computed(
  () => appliedOptions.value?.items ?? control.value.options ?? []
);

/** Read by literal path: `control.data` never resolves for a dotted column. */
const selected = computed<unknown[]>(
  () => get(jsonforms?.core?.data, literalPath.value) ?? []
);

const triggerLabel = computed(() =>
  isEmpty(selected.value)
    ? control.value.label
    : `${control.value.label} (${size(selected.value)})`
);

// --- methods

/** Toggles one value and writes the WHOLE next selection. */
function onSelect(value: unknown, event: Event): void {
  event.preventDefault();

  handleChange(
    control.value.path,
    includes(selected.value, value)
      ? without(selected.value, value)
      : [...selected.value, value]
  );
}
</script>

<script lang="ts">
const hasOneOfItems = (schema: JsonSchema): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf as JsonSchema[]).every(entry => entry.const !== undefined);

const hasEnumItems = (schema: JsonSchema): boolean =>
  schema.type === "string" && schema.enum !== undefined;

/**
 * `rank: 6` — one above the ui package's own `StringsRenderer` (rank 5), which
 * testers on this same leaf shape. The bar's declaration opts in by format;
 * every other form keeps the tile stack.
 */
export const tester = {
  rank: 6,
  controlType: and(
    optionIs("format", "multi-select"),
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
};
</script>
