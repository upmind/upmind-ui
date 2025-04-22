<template>
  <FormField v-bind="formFieldProps">
    <Search
      :results="searchResults"
      @update:search="searchAddresses"
      @select="selectAddress"
      :placeholder="appliedOptions?.placeholder"
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
import type { Address } from "@upmind-automation/headless-vue";

import { debounce, isEmpty, find } from "lodash-es";
import { usePlaces } from "@upmind-automation/headless-vue";
import { ref, onMounted, computed } from "vue";
// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const places = usePlaces();

const { appliedOptions, formFieldProps, updateControl } = useUpmindUIRenderer(
  useJsonFormsControl(props)
);
const parsedResults = ref<any[]>([]);

onMounted(async () => {
  await places.load();
});

const searchAddresses = debounce(async (query: string) => {
  if (!query || query.length < 3) {
    parsedResults.value = [];
    return;
  }

  const results = await places.search(query);
  if (!isEmpty(results)) {
    parsedResults.value = results;
  }
}, 300);

const searchResults = computed(() => {
  return parsedResults.value.map(
    (result: any) =>
      ({
        id: result.id,
        label: result.description,
      }) as SearchItem
  );
});

const selectAddress = (selectedItem: SearchItem) => {
  const address = find(
    parsedResults.value,
    address => address.id === selectedItem.id
  ).address as Address;

  updateControl("id", address.id ?? "");
  updateControl("address1", address.address1 ?? "");
  updateControl("address2", address.address2 ?? "");
  updateControl("city", address.city ?? "");
  updateControl("postcode", address.postcode ?? "");
  updateControl("countryId", address.countryId ?? "");
};
</script>

<script lang="ts">
import { isStringControl, formatIs, and } from "@jsonforms/core";
export const tester = {
  rank: 3,
  controlType: and(isStringControl, formatIs("address")),
};
</script>
