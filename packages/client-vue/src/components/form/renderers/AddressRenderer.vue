<template>
  <FormField
    v-bind="formFieldProps"
    :label="showAddressFields ? '' : appliedOptions?.label"
    required
  >
    <Search
      v-if="!showAddressFields"
      :results="searchResults"
      @update:search="searchAddresses"
      @select="selectAddress"
      :placeholder="appliedOptions?.placeholder"
      additional-option="Enter address manually"
      class="mb-6"
    />

    <section>
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

      <Link
        v-if="!showAddressFields"
        class="mt-2"
        label="Enter address manually"
        size="sm"
        variant="muted"
        @click="setShowAddressFields(true)"
      />
    </section>
  </FormField>
</template>

<script setup lang="ts">
// --- external
import { computed, ref, onMounted, inject } from "vue";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControlWithDetail,
} from "@jsonforms/vue";

// --- components
import { FormField, Search, Link } from "@upmind-automation/upmind-ui";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { debounce, isEmpty, find, get, last } from "lodash-es";
import { useAddressFields } from "../composables/useAddressFields";

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

const { control, appliedOptions, formFieldProps } = useUpmindUIRenderer(
  useJsonFormsControlWithDetail(props)
);

const { showAddressFields, setShowAddressFields, setSelectedAddress } =
  useAddressFields();

const places = usePlaces();
const addresses = ref<any[] | null>(null);

onMounted(async () => {
  await places.load();
});

const detailUiSchema: ComputedRef<UISchemaElement> = computed(() => {
  return {
    ...control.value.uischema,
    type: "VerticalLayout",
  };
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

const searchAddresses = debounce(async (query: string) => {
  if (!query || query.length < 3) {
    addresses.value = null;
    return;
  }

  const results = await places.search(
    query,
    get(control.value.data, "countryId")
  );

  addresses.value = results;
}, 300);

const searchResults = computed(() => {
  if (!addresses.value) return null;

  return addresses.value.map(
    (result: any) =>
      ({
        id: result.id,
        label: result.description,
      }) as SearchItem
  );
});

const selectAddress = (data: SearchItem) => {
  if (!addresses.value) return;

  const address = find(addresses.value, a => a.id === data.id)
    .address as Address;
  setAddress(address);
  showAddressFields.value = !isEmpty(nestedErrors.value);
};

const setAddress = async (address: Address) => {
  setSelectedAddress(address);
};
</script>

<script lang="ts">
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("address")),
};
</script>
