<template>
  <div>
    <!-- <pre>{{ { meta, type, selected, open, modelValue } }}</pre> -->

    <RadioCardsCollapsible
      v-if="!meta.isLoading && !meta.isEmpty"
      v-model:open="open"
      v-model="selected"
      :items="parsedValues"
      :list="false"
      required
    >
      <template #item="{ item }">
        <component
          :is="Item"
          v-bind="item"
          :readonly="props.readonly"
          @edit="editItem"
        />
      </template>

      <template #actions>
        <Link
          v-if="!open && parsedValues.length > 1"
          :label="t('billing.actions.change')"
          size="xs"
          variant="muted"
          @click="open = true"
        />

        <Link
          v-else-if="!readonly"
          :label="t('billing.actions.add', { type })"
          size="xs"
          variant="muted"
          @click="openModel = true"
        />
      </template>
    </RadioCardsCollapsible>

    <Form
      v-if="(!meta.isLoading && meta.isEmpty) || editId || true"
      v-model:open="openModel"
      :client-id="props.clientId"
      :model="!meta.isEmpty"
      :id="editId"
      :type="props.type"
      @resolve="doResolve"
      @reject="doReject"
    />
  </div>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useClientAddresses,
  useClientCompanies,
  useClientPhones,
  UnifiedAddressType,
} from "@upmind-automation/headless";

// --- components
import { RadioCardsCollapsible, Link } from "@upmind-automation/upmind-ui";
import Form from "./Form.vue";
import PhoneItem from "./Phone.vue";
import AddressItem from "./Address.vue";
import CompanyItem from "./Company.vue";

// --- utils
import { first, lowerCase, map } from "lodash-es";

// --- types

import type { BillingModel } from "@upmind-automation/headless";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import { useVModel } from "@vueuse/core";

// -----------------------------------------------------------------------------

const props = defineProps<{
  clientId: string;
  type: UnifiedAddressType;
  modelValue?: BillingModel;
  readonly?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: BillingModel): void;
}>();

const { t } = useI18n();
// -----------------------------------------------------------------------------
const {
  data,
  meta,
  default: defaultItem,
} = props.type == UnifiedAddressType.PERSONAL
  ? useClientAddresses()
  : useClientCompanies();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
});

// -----------------------------------------------------------------------------
const open = ref(false);
const openModel = ref(meta.value.isEmpty);
const editId = ref<string>("");

const selected = computed<string | undefined>({
  get() {
    return (
      modelValue.value?.companyId ||
      modelValue.value?.addressId ||
      modelValue.value?.phoneId ||
      defaultItem.value?.id
    );
  },
  set(val: string) {
    if (props.type === UnifiedAddressType.BUSINESS) {
      modelValue.value = {
        companyId: val,
      };
    } else {
      modelValue.value = {
        addressId: val,
      };
    }
  },
});

const parsedValues = computed(() => {
  return map(data.value || [], (item: any, index: number) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      item: item,
      index: index,
      // modelValue: modelValue.value,
    };
  }) as RadioCardsItemProps[];
});

const Item = computed(() => {
  switch (props.type) {
    case UnifiedAddressType.BUSINESS:
      return CompanyItem;
    default:
      return AddressItem;
  }
});

const editItem = (id: string) => {
  editId.value = id;
  openModel.value = true;
};

function doReject() {
  openModel.value = false;
  editId.value = "";
}

function doResolve(value: BillingModel) {
  modelValue.value = value;
  openModel.value = false;
  editId.value = "";
}
</script>
