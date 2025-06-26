<template>
  <Loading :active="meta.isLoading" class="w-full">
    <List
      i18nKey="client.address"
      :useList="useClientAddresses"
      v-model="selectedAddress"
      :readonly="props.readonly"
      @add="doAdd(EditingType.Address)"
      @edit="doEdit($event, EditingType.Address)"
    >
      <template #item="{ item }">
        <AddressItem
          v-bind="item"
          :readonly="props.readonly"
          @edit="doEdit(item.id, EditingType.Address)"
        />
      </template>
    </List>

    <List
      i18nKey="client.phone"
      :useList="useClientPhones"
      v-model="selectedPhone"
      :readonly="props.readonly"
      @add="doAdd(EditingType.Phone)"
      @edit="doEdit($event, EditingType.Phone)"
      minimal
    >
      <template #item="{ item }">
        <PhoneItem
          v-bind="item"
          :readonly="props.readonly"
          @edit="doEdit(item.id, EditingType.Phone)"
        />
      </template>
    </List>

    <Form
      v-if="openForm && editing && useMutate"
      :key="editing"
      :i18nKey="i18nKey"
      :useMutate="useMutate"
      :open="openForm"
      :model-value="editId"
      :modal="modal"
      @resolve="doResolve"
      @reject="doReset"
    />
  </Loading>
</template>

<script setup lang="ts">
// --- external
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal
import {
  useClientAddresses,
  useClientAddress,
  useClientPhones,
  useClientPhone,
  useUnifiedAddress,
  UnifiedAddressType,
} from "@upmind-automation/headless";

// --- components
import List from "../../../components/manage/List.vue";
import Form from "../../../components/manage/Form.vue";
import { Loading } from "@upmind-automation/upmind-ui";

// --- utils
import { find, isString, set } from "lodash-es";

// --- types

import type { BillingModel } from "@upmind-automation/headless";
import type { MinimalMutateComposable } from "../../../components/manage/types";
import AddressItem from "./AddressItem.vue";
import PhoneItem from "./PhoneItem.vue";

enum EditingType {
  Address = "address",
  Phone = "phone",
  Unified = "unified",
}
// -----------------------------------------------------------------------------

const props = defineProps<{
  modelValue?: BillingModel;
  readonly?: boolean;
}>();

const emits = defineEmits<{
  (e: "resolve", value: BillingModel): void;
  (e: "update:modelValue", value: BillingModel): void;
}>();

const { t } = useI18n();

// -----------------------------------------------------------------------------

const {
  data: addresses,
  meta: addressMeta,
  default: defaultAddress,
  isReady: isAddressesReady,
} = useClientAddresses();

const {
  data: phones,
  meta: phoneMeta,
  default: defaultPhone,
  isReady: isPhonesReady,
} = useClientPhones();

const meta = computed(() => ({
  isEmpty: addressMeta.value.isEmpty || phoneMeta.value.isEmpty,
  isLoading: addressMeta.value.isLoading || phoneMeta.value.isLoading,
}));

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  deep: true,
  defaultValue: {
    addressId: defaultAddress.value?.id,
    phoneId: defaultPhone.value?.id,
  },
});

// -----------------------------------------------------------------------------
// const open = ref(false);
const openForm = ref(meta.value.isEmpty);
const editing = ref<EditingType | undefined>();
const editId = ref<string | undefined>();

// --- context

const selectedAddress = computed({
  get() {
    return modelValue.value?.addressId ?? undefined;
  },
  set(val: string | undefined) {
    modelValue.value ??= {};
    const found = find(addresses.value, { id: val });
    if (found) {
      set(modelValue.value, "addressId", found.id);
    }
  },
});

const selectedPhone = computed({
  get() {
    return modelValue.value?.phoneId ?? undefined;
  },
  set(val: string | undefined) {
    modelValue.value ??= {};
    const found = find(phones.value, { id: val });
    if (found) {
      set(modelValue.value, "phoneId", found.id);
    }
  },
});

const i18nKey = computed(() => {
  if (editing.value === EditingType.Unified) return "client.address";
  return `client.${editing.value}`;
});

const useMutate = computed((): MinimalMutateComposable => {
  if (editing.value === EditingType.Address) return useClientAddress;
  if (editing.value === EditingType.Phone) return useClientPhone;
  if (editing.value === EditingType.Unified) return useUnifiedAddress;

  throw new Error(`Unknown editing type: ${editing.value}`);
});

const modal = computed<boolean>(() => {
  switch (editing.value) {
    case EditingType.Address:
      return !!editId.value;

    case EditingType.Phone:
      return !!editId.value;

    case EditingType.Unified:
      return false;

    default:
      return true;
  }
});

// --- methods

function doAdd(type: EditingType) {
  editing.value = type;
  editId.value =
    type == EditingType.Unified ? UnifiedAddressType.PERSONAL : undefined;
  openForm.value = true;
}

function doEdit(id: string, type: EditingType) {
  editing.value = type;
  openForm.value = true;
  editId.value = id;
}

function doReset() {
  if (!modelValue.value?.addressId) {
    doAdd(EditingType.Unified);
  } else if (!modelValue.value?.phoneId) {
    doAdd(EditingType.Phone);
  } else {
    openForm.value = false;
    editId.value = undefined;
    editing.value = undefined;
  }
}

function doResolve(value: BillingModel | string) {
  switch (editing.value) {
    case EditingType.Address:
      selectedAddress.value = isString(value)
        ? value
        : (value?.addressId ?? defaultAddress.value?.id ?? undefined);
      break;

    case EditingType.Phone:
      selectedPhone.value = isString(value)
        ? value
        : (value?.phoneId ?? defaultPhone.value?.id ?? undefined);
      break;

    case EditingType.Unified:
      selectedPhone.value = isString(value)
        ? value
        : (value?.phoneId ?? defaultPhone.value?.id ?? undefined);

      selectedAddress.value = isString(value)
        ? value
        : (value?.addressId ?? defaultAddress.value?.id ?? undefined);
      break;
    default:
  }

  if (modelValue.value) emits("resolve", modelValue.value as BillingModel);

  // reset our state
  doReset();
}

// --- side effects

await Promise.all([isAddressesReady(), isPhonesReady()]).then(() => {
  // Ensure modelValue is initialized with default values
  modelValue.value = {
    addressId: modelValue.value?.addressId ?? defaultAddress.value?.id,
    phoneId: modelValue.value?.phoneId ?? defaultPhone.value?.id,
  };

  if (!modelValue.value.addressId) {
    doAdd(EditingType.Unified);
  } else if (!modelValue.value.phoneId) {
    doAdd(EditingType.Phone);
  } else {
    doResolve(modelValue.value);
  }
});
</script>
