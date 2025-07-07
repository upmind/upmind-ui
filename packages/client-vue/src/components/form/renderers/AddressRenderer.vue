<template>
  <FormField
    v-bind="formFieldProps"
    :label="showAddressFields ? '' : appliedOptions?.label"
    required
    :id="formFieldProps?.id ?? 'address-search'"
  >
    <Search
      v-if="!showAddressFields"
      :autoFocus="formFieldProps?.autoFocus"
      :placeholder="appliedOptions?.placeholder"
      :results="predictions"
      additional-option="Enter address manually"
      class="mb-6"
      @select="selectAddress"
      @update:search="getSuggestions"
      :minQueryLength="1"
    />

    <section>
      <DispatchRenderer
        v-if="showAddressFields"
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
import { computed, ref, onMounted } from "vue";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControlWithDetail
} from "@jsonforms/vue";

// --- components
import { FormField, Search, Link } from "@upmind-automation/upmind-ui";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { debounce, find, get } from "lodash-es";
// --- types
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
import type { ComputedRef } from "vue";
import { usePlaces } from "@upmind-automation/headless";
import type { SearchItem } from "@upmind-automation/upmind-ui";
import type { Address, Place } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const props = defineProps({
  ...rendererProps<ControlElement>()
});

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControlWithDetail(props));

const showAddressFields = ref(false);

const { search, predictions, getPlaceDetails } = usePlaces();

onMounted(async () => {
  const showAddressFields = get(control.value.data, "showAddressFields");
  if (showAddressFields) {
    setShowAddressFields(true);
  }
});

const detailUiSchema: ComputedRef<UISchemaElement> = computed(() => {
  return {
    ...control.value.uischema,
    type: "VerticalLayout"
  };
});

// TODO : remove the debounc ein favour of signal abortion
const getSuggestions = debounce(async (query: string) => {
  search(query, get(control.value.data, "countryId"));
}, DEBOUNCE_DELAY);

const selectAddress = (data: SearchItem) => {
  if (data.id === "additional") {
    setShowAddressFields(true);
    return;
  }

  getPlaceDetails(data.id).then((place: Place | undefined) => {
    if (!place) {
      setShowAddressFields(true);
      return;
    }
    setAddress(place.address as Address);
  });
};

const setAddress = async (address: Address) => {
  setShowAddressFields(true);
  onInput(
    {
      ...control.value.data,
      ...address
    },
    false
  );
};

const setShowAddressFields = (value: boolean) => {
  showAddressFields.value = value;
  onInput(
    {
      ...control.value.data,
      showAddressFields: value
    },
    false
  );
};
</script>

<script lang="ts">
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
import { utils } from "@upmind-automation/headless";
const { DEBOUNCE_DELAY } = utils;

export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("address"))
};
</script>
