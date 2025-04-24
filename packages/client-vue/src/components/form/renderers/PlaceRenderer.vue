<template>
  <section class="flex flex-col gap-y-6">
    <Search
      :results="searchResults"
      @update:search="searchAddresses"
      @select="selectAddress"
      :placeholder="appliedOptions?.placeholder"
    />
    <DispatchRenderer
      v-show="showAddressFields"
      :visible="control.visible"
      :enabled="control.enabled"
      :schema="control.schema"
      :uischema="detailUiSchema"
      :path="control.path"
      :renderers="control.renderers"
      :cells="control.cells"
    />
  </section>
</template>

<script setup lang="ts">
// --- external
import { computed, ref, onMounted, inject } from "vue";
import { Generate } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControlWithDetail,
} from "@jsonforms/vue";

// --- components
import { Search } from "@upmind-automation/upmind-ui";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { debounce, isEmpty, find, filter, last } from "lodash-es";

// --- types
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
import type { ComputedRef } from "vue";
import { usePlaces } from "@upmind-automation/headless-vue";
import type { SearchItem } from "@upmind-automation/upmind-ui";
import type { Address } from "@upmind-automation/headless-vue";

// ----------------------------------------------

const props = defineProps({
  ...rendererProps<ControlElement>(),
});

const jsonforms: any = inject("jsonforms", { core: { errors: [] } });

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

const nestedErrors = computed(() => {
  const errors = jsonforms?.core?.errors || [];

  return errors
    .filter(
      (error: { instancePath: string; message?: string }) =>
        error.instancePath.startsWith(`/${control.value.path}`) &&
        error.instancePath !== `/${control.value.path}`
    )
    .map((error: { instancePath: string; message?: string }) => {
      return `${last(error.instancePath.split("/"))}: ${error.message}`;
    });
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

const selectAddress = (data: SearchItem) => {
  const address = find(addresses.value, a => a.id === data.id)
    .address as Address;

  // TODO: Find a nicer way of setting every nested input as touched to enable validation
  const properties = control.value.schema.properties;
  if (properties) {
    Object.keys(properties).forEach(fieldName => {
      updateControl(`${control.value.path}.${fieldName}`, "");
    });
  }

  updateControl("address", address);
  showAddressFields.value = !isEmpty(nestedErrors.value);
};
</script>

<script lang="ts">
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("Place")),
};
</script>
