<template>
  <div>
    <pre>{{ { type, selected, open, modelValue } }}</pre>

    <RadioCardsCollapsible
      v-if="!meta.isLoading && !meta.isEmpty"
      v-model:open="open"
      v-model="selected"
      :items="parsedValues"
      :list="false"
      :minimal="type === BillingType.PHONE"
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
          :label="t('billing.actions.add', { type: lowerCase(type) })"
          size="xs"
          variant="muted"
          @click="openModel = true"
        />
      </template>
    </RadioCardsCollapsible>

    <Form
      v-if="(!meta.isLoading && meta.isEmpty) || editId"
      v-model:open="openModel"
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
  type BillingModel,
} from "@upmind-automation/headless";

// --- components
import { RadioCardsCollapsible, Link } from "@upmind-automation/upmind-ui";
import Form from "./Form.vue";
import PhoneItem from "./Phone.vue";
import AddressItem from "./Address.vue";
import CompanyItem from "./Company.vue";

// --- utils
import { lowerCase, map } from "lodash-es";

// --- types
import type { Company } from "@upmind-automation/headless";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";
import { BillingType } from "../types";
import { useVModel } from "@vueuse/core";

// -----------------------------------------------------------------------------

const props = defineProps<{
  type: BillingType;
  modelValue?: BillingModel;
  readonly?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: BillingModel): void;
}>();

const { t } = useI18n();
// -----------------------------------------------------------------------------

const initialised = ref(false);

const {
  isReady,
  meta,
  data,
  default: defaultItem,
} = props.type === BillingType.BUSINESS
  ? useClientCompanies()
  : useClientAddresses();

initialised.value = await isReady();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: {
    addressId:
      props.type == BillingType.BUSINESS
        ? (defaultItem.value as Company)?.addressId
        : defaultItem.value?.id,
    companyId:
      props.type == BillingType.BUSINESS ? defaultItem.value?.id : undefined,
    phoneId:
      props.type == BillingType.BUSINESS
        ? (defaultItem.value as Company)?.phoneId
        : undefined,
  },
});

// -----------------------------------------------------------------------------
const open = ref(false);
const openModel = ref(meta.value.isEmpty);
const editId = ref<string>("");

const selected = computed<string>({
  get() {
    return (
      modelValue.value?.companyId ||
      modelValue.value?.addressId ||
      modelValue.value?.phoneId ||
      ""
    );
  },
  set(val: string) {
    if (props.type === BillingType.BUSINESS) {
      modelValue.value = {
        companyId: val,
      };
    } else if (props.type === BillingType.PHONE) {
      modelValue.value = {
        phoneId: val,
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
    case BillingType.PHONE:
      return PhoneItem;
    case BillingType.BUSINESS:
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
