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
        @click="showAddressFields = true"
      />
    </section>
  </FormField>
</template>

<script setup lang="ts">
// --- external
import { computed, ref, onMounted } from "vue";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControlWithDetail,
} from "@jsonforms/vue";

// --- components
import { FormField, Search, Link } from "@upmind-automation/upmind-ui";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { debounce, find, get } from "lodash-es";
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

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControlWithDetail(props));

const showAddressFields = ref(false);

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

  // Dropdown option to enter address manually (they haven't selected an address)
  if (data.id === "additional") {
    showAddressFields.value = true;
    return;
  }

  const address = find(addresses.value, a => a.id === data.id)
    .address as Address;
  setAddress(address);
};

const setAddress = async (address: Address) => {
  showAddressFields.value = true;
  onInput(
    {
      ...control.value.data,
      ...address,
    },
    false
  );
};
</script>

<script lang="ts">
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("address")),
};
</script>
