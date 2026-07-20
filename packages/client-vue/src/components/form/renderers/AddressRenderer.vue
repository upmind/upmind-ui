<template>
  <FormField
    v-bind="formFieldProps"
    :label="open ? '' : appliedOptions?.label"
    :required="!appliedOptions?.hideRequiredAsterisk"
    :id="formFieldProps?.id ?? 'address-search'"
  >
    <template v-if="!open">
      <Search
        id="search"
        :autoFocus="formFieldProps?.autoFocus"
        :placeholder="t('form.address.placeholder')"
        :results="predictions"
        :additional-option="t('action.enter_address_manually')"
        :data-attrs="{ 'data-test-key': 'address-search-option' }"
        class="mb-6"
        @select="selectAddress"
        @update:search="getSuggestions"
        :minQueryLength="1"
      />
      <footer>
        <Link
          class="mt-2"
          :label="t('action.enter_address_manually')"
          size="sm"
          color="muted"
          :dataAttrs="{ 'data-test-key': 'link-enter-address-manually' }"
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
import { and, isLayout, uiTypeIs } from "@jsonforms/core";
import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsControlWithDetail
} from "@jsonforms/vue";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { usePlaces } from "@upmind-automation/headless";
import { FormField, Search, Link } from "@upmind-automation/upmind-ui";
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { get } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { Place } from "@upmind-automation/headless";
import type { SearchItem } from "@upmind-automation/upmind-ui";
// --- external

// -----------------------------------------------------------------------------
const props = defineProps({
  ...rendererProps<ControlElement>()
});

// -----------------------------------------------------------------------------
const { t } = useI18n();

const { search, predictions, getPlaceDetails } = usePlaces();

const { control, appliedOptions, formFieldProps, onInput } =
  useUpmindUIRenderer(useJsonFormsControlWithDetail(props));

// --- state
const open = ref(false);

const detailUiSchema = computed(() => {
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
export const tester = {
  rank: 2,
  controlType: and(isLayout, uiTypeIs("address"))
};
</script>
