<template>
  <FormField
    v-bind="formFieldProps"
    :label="open ? '' : appliedOptions?.label"
    required
    :id="formFieldProps?.id ?? 'address-search'"
  >
    <template v-if="!open">
      <Search
        :autoFocus="formFieldProps?.autoFocus"
        :placeholder="appliedOptions?.placeholder"
        :results="predictions"
        additional-option="Enter address manually"
        class="mb-6"
        @select="selectAddress"
        @update:search="getSuggestions"
        :minQueryLength="1"
      />
      <footer>
        <Button
          variant="link"
          class="mt-2"
          label="Enter address manually"
          size="sm"
          color="muted"
          @click="setShowAddressFields(true)"
        />
      </footer>
    </template>

    <DispatchRenderer
      v-else
      :visible="control.visible"
      :enabled="control.enabled"
      :schema="control.schema"
      :uischema="detailUiSchema"
      :path="control.path"
      :renderers="control.renderers"
      :cells="control.cells"
    />
  </FormField>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControlWithDetail
} from "@jsonforms/vue";

// --- internal
import { usePlaces } from "@upmind-automation/headless";

// --- components
import { FormField, Search, Button } from "@upmind-automation/upmind-ui";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { get } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { ControlElement, UISchemaElement } from "@jsonforms/core";
import type { SearchItem } from "@upmind-automation/upmind-ui";
import type { Place } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
const props = defineProps({
  ...rendererProps<ControlElement>()
});

// -----------------------------------------------------------------------------

const { search, predictions, getPlaceDetails } = usePlaces();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControlWithDetail(props));

// --- state
const open = ref(false);

const detailUiSchema: ComputedRef<UISchemaElement> = computed(() => {
  return {
    ...control.value.uischema,
    type: "VerticalLayout"
  };
});

//  --- methods

function getSuggestions(query: string) {
  search(query, get(control.value.data, "countryId"));
}

function selectAddress(data: SearchItem) {
  setShowAddressFields(true);

  if (data.id === "additional") return;

  getPlaceDetails(data.id).then((place: Place | undefined) => {
    if (place) {
      onInput(
        {
          ...control.value.data,
          ...place.address
        },
        false
      );
    }
  });
}

function setShowAddressFields(value: boolean = true) {
  open.value = value;
}
</script>

<script lang="ts">
import { and, isLayout, uiTypeIs } from "@jsonforms/core";

export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("address"))
};
</script>
