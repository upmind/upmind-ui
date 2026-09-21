<template>
  <FormField v-bind="formFieldProps">
    <Combobox
      v-model:open="open"
      :model-value="control.data"
      class="w-full"
      :size="appliedOptions?.size"
      :items="items"
      :display-value="displayValue"
      :placeholder="placeholder"
      :empty-label="t('text.no_results')"
      :ui="{ input: 'flex-1' }"
      :ignore-filter="isAsync"
      reset-search-term-on-blur
      @update:model-value="onInput"
      @focus="open = true"
      @input="onSearchInput"
    >
      <!-- The search affordance: a lens in the input signals the list is
           type-to-search (async lookups only). -->
      <template v-if="isAsync" #prefix>
        <Icon icon="search-md" class="text-muted size-4 shrink-0" />
      </template>

      <!-- Async: reka's empty row shows while items are absent — say "searching"
           there rather than "no results" while a page is in flight. -->
      <template v-if="isAsync" #empty>
        {{ asyncMeta?.isLoading ? t("text.searching") : t("text.no_results") }}
      </template>

      <!-- Load-more + count PINNED inside the popover as part of the results, on
           the popover's own surface, shown only while more pages remain. -->
      <template v-if="isAsync && asyncMeta?.hasMore" #footer>
        <div
          class="border-stroke bg-surface-raised flex items-center justify-between gap-2 border-t px-2 py-1.5"
        >
          <span class="text-muted text-xs"
            >{{ items.length
            }}<template v-if="lookup?.total.value">
              / {{ lookup.total.value }}</template
            ></span
          >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            :loading="asyncMeta?.isLoading"
            @click="lookup?.loadMore()"
          >
            {{ t("action.load_more") }}
          </Button>
        </div>
      </template>
    </Combobox>
  </FormField>
</template>

<script lang="ts" setup>
import { uiTypeIs } from "@jsonforms/core";
import { useJsonFormsOneOfEnumControl } from "@jsonforms/vue";
import { Button, Combobox, FormField, useUpmindUIRenderer } from "@upmind/ui";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useLookup } from "@upmind-automation/headless";
import { Icon } from "../../icon";
import { debounce, find, isFunction } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { ListQuery } from "@upmind-automation/headless";
import type { LookupItem } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

/** The `options.lookup` bag a control carries — the live-reference seam. */
type LookupControlOptions = {
  /** A THUNK returning the once-minted lookup query — JSON-safe (see the schema). */
  service?: () => ListQuery<unknown, LookupItem[]>;
  /** The criteria path the typed term writes; `useLookup`'s own default when absent. */
  searchScope?: string;
  /** The current selection, seeded so its label shows before any search (AC7). */
  current?: LookupItem;
  /** Embedded options for the static (no-service) fallback (AC8). */
  options?: LookupItem[];
};

const SEARCH_DEBOUNCE = 300;

const props = defineProps<RendererProps<ControlElement>>();

const { control, appliedOptions, onInput, formFieldProps } =
  useUpmindUIRenderer(useJsonFormsOneOfEnumControl(props));

const { t } = useI18n();
const open = ref(false);

// The `options.lookup` bag rides the uischema as a live reference. `service` is
// a thunk (not the reactive handle) so it survives `appliedOptions`' cloneDeep
// and any JSON round-trip; calling it returns the once-per-scope query.
const lookupOptions = appliedOptions.value?.lookup as
  | LookupControlOptions
  | undefined;

const lookup = isFunction(lookupOptions?.service)
  ? useLookup(lookupOptions!.service(), {
      searchScope: lookupOptions?.searchScope
    })
  : undefined;

const isAsync = !!lookup;
const asyncMeta = computed(() => lookup?.meta.value);

// A search affordance in the input: the control's own placeholder, else a
// generic "search" prompt for an async lookup.
const placeholder = computed(
  () =>
    (appliedOptions.value?.placeholder as string | undefined) ??
    (isAsync ? t("action.search") : undefined)
);

// Async: the server already filtered, so options are the service's own. Static:
// reka filters the embedded options client-side, exactly as before (AC8).
const items = computed<LookupItem[]>(() =>
  isAsync
    ? (lookup!.items.value ?? [])
    : (control.value?.options as LookupItem[]) ||
      (appliedOptions.value?.items as LookupItem[]) ||
      lookupOptions?.options ||
      []
);

// The linked selection's label survives an empty first page (AC7): seeded from
// `options.lookup.current`, then latched to the matching option once it loads.
const currentOption = ref<LookupItem | undefined>(lookupOptions?.current);
watch([() => control.value?.data, items], ([value, list]) => {
  const found = find(list, i => i.value === value);
  if (found) currentOption.value = found;
});

function displayValue(value: unknown) {
  const match = find(items.value, i => i.value === value);
  if (match) return match.label;
  const current = currentOption.value;
  return current && current.value === value ? current.label : "";
}

const debouncedSearch = debounce(
  (term: string) => lookup?.search(term),
  SEARCH_DEBOUNCE
);

function onSearchInput(event: Event) {
  if (!isAsync) return;
  debouncedSearch((event.target as HTMLInputElement).value);
}

onBeforeUnmount(() => debouncedSearch.cancel());
</script>

<script lang="ts">
export const tester = {
  rank: 3,
  controlType: uiTypeIs("Lookup")
};
</script>
