<template>
  <FormField v-bind="formFieldProps">
    <Search
      label="Search for an address"
      placeholder="Type at least 3 characters..."
      :results="searchResults"
      @update:search="searchAddresses"
    />
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import {
  FormField,
  Search,
  type SearchItem,
} from "@upmind-automation/upmind-ui";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

import { debounce, isEmpty } from "lodash-es";
import { usePlaces } from "@upmind-automation/headless-vue";
import { ref, onMounted, computed } from "vue";

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const places = usePlaces();
const { formFieldProps } = useUpmindUIRenderer(useJsonFormsControl(props));
const parsedResults = ref<any[]>([]);

onMounted(async () => {
  await places.load();
});

const searchAddresses = debounce(async (query: string) => {
  if (!query || query.length < 3) return;

  const results = await places.search(query);
  if (!isEmpty(results)) {
    parsedResults.value = results;
  }
}, 300);

const searchResults = computed(() => {
  return parsedResults.value.map(
    (result: any) =>
      ({
        id: result.description,
        label: result.description,
      }) as SearchItem
  );
});
</script>

<script lang="ts">
import { isStringControl, formatIs, and } from "@jsonforms/core";
export const tester = {
  rank: 3,
  controlType: and(isStringControl, formatIs("address")),
};
</script>
