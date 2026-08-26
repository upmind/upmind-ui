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
        :size="appliedOptions?.size"
        :autoFocus="formFieldProps?.autoFocus"
        :placeholder="t('form.address.placeholder')"
        :results="predictions"
        :additional-option="t('action.enter_address_manually')"
        option-test-key="address-search-option"
        class="mb-6"
        @select="selectAddress"
        @update:search="getSuggestions"
        :minQueryLength="1"
      />
      <footer>
        <Link
          class="mt-2"
          size="sm"
          color="muted"
          :data-attrs="{ 'data-test-key': 'link-enter-address-manually' }"
          @click="setShowAddressFields(true)"
          >{{ t("action.enter_address_manually") }}</Link
        >
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
import { Search } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { usePlaces } from "@upmind-automation/headless";
import FormField from "../engine/FormField.vue";
import { useUpmindUIRenderer } from "../engine/renderers/utils";
import { get } from "lodash-es";
import type { ControlElement } from "@jsonforms/core";
import type { SearchItem } from "@upmind/ui";
import type { Place } from "@upmind-automation/headless";
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
