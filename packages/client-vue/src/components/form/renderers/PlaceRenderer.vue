<template>
  <Search
    :results="searchResults"
    @update:search="searchAddresses"
    @select="selectAddress"
  />

  <DispatchRenderer
    v-if="showAddressFields"
    class="mt-6"
    :visible="control.visible"
    :enabled="control.enabled"
    :schema="control.schema"
    :uischema="detailUiSchema"
    :path="control.path"
    :renderers="control.renderers"
    :cells="control.cells"
  />
</template>

<script setup lang="ts">
// --- external
import { computed, ref, onMounted } from "vue";
import { Generate, findUISchema } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControlWithDetail,
} from "@jsonforms/vue";

// --- components
import { Search } from "@upmind-automation/upmind-ui";

// --- utils
import {
  useUpmindUILayoutRenderer,
  useUpmindUIRenderer,
  useStyles,
} from "@upmind-automation/upmind-ui";
import { debounce, isEmpty, find, filter } from "lodash-es";

// --- types
import type {
  ControlElement,
  GroupLayout,
  UISchemaElement,
} from "@jsonforms/core";
import type { ComputedRef } from "vue";
import { usePlaces } from "@upmind-automation/headless-vue";
import type { SearchItem } from "@upmind-automation/upmind-ui";
import type { Address } from "@upmind-automation/headless-vue";

// ----------------------------------------------

const props = defineProps({
  ...rendererProps<ControlElement>(),
});

const { control, appliedOptions, formFieldProps, updateControl } =
  useUpmindUIRenderer(useJsonFormsControlWithDetail(props));

const detailUiSchema: ComputedRef<UISchemaElement> = computed(() => {
  const allowedFields = control.value.uischema.options?.fields || [];

  const uiSchema = Generate.uiSchema(
    control.value.schema,
    "VerticalLayout",
    undefined,
    control.value.rootSchema
  );

  if (isLayout(uiSchema) && uiSchema.elements) {
    uiSchema.elements = filter(uiSchema.elements, (element: any) => {
      const fieldName = element.scope?.split("/").pop();
      return fieldName && allowedFields.includes(fieldName);
    }) as UISchemaElement[];
  }

  return uiSchema;
});

const places = usePlaces();

const showAddressFields = ref<boolean>(false);

const addresses = ref<any[]>([]);

onMounted(async () => {
  await places.load();
});

const searchAddresses = debounce(async (query: string) => {
  if (!query || query.length < 3) {
    addresses.value = [];
    return;
  }

  const results = await places.search(query);
  if (!isEmpty(results)) {
    addresses.value = results;
  }
}, 300);

const searchResults = computed(() => {
  return addresses.value.map(
    (result: any) =>
      ({
        id: result.id,
        label: result.description,
      }) as SearchItem
  );
});

const selectAddress = (selectedItem: SearchItem) => {
  const address = find(addresses.value, a => a.id === selectedItem.id)
    .address as Address;

  updateControl("address", address);
  showAddressFields.value = true;
};
</script>

<script lang="ts">
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("Place")),
};
</script>
