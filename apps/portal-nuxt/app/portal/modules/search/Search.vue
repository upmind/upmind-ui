<template>
  <EmptyState
    v-if="meta.isEmpty"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
  />
  <PortalSearch
    v-else
    v-model="query"
    :results="filteredResults"
    :placeholder="props.placeholder"
    :min-query-length="props.minQueryLength"
  />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/search/Search
 * @description The `search` module (tasks.md 5.2, `search`-tagged), over
 * `@upmind/ui`'s `Search`. Filters the fixture dataset it is handed
 * (`ModuleRef.props`) client-side, on typed text alone — never a fetch
 * (tasks.md 5.7), and never a source of its own.
 */
import { EmptyState, Search as PortalSearch } from "@upmind/ui";
import { computed, ref } from "vue";
import { filter, includes, toLower } from "lodash-es";
import type { SearchModuleProps } from "./types";

defineOptions({ name: "PortalSearchModule" });

const props = defineProps<SearchModuleProps>();

const meta = computed(() => ({ isEmpty: props.items.length === 0 }));

const query = ref("");

const filteredResults = computed(() =>
  filter(props.items, item =>
    includes(toLower(item.label), toLower(query.value))
  )
);
</script>
