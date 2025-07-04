<template>
  <Loading :active="meta.isLoading" class="w-full">
    <Form
      v-if="meta.isEmpty"
      i18nKey="client.address"
      :useMutate="useUnifiedBillingDetail"
      open
      :modal="false"
      @resolve="doResolve"
    />

    <template v-else>
      <Manage
        i18n-key="client.address"
        v-model="selectedAddress"
        :manage="{
          useList: useClientAddresses,
          useMutate: useClientAddress
        }"
      />

      <Manage
        i18n-key="client.phone"
        v-model="selectedPhone"
        :manage="{
          useList: useClientPhones,
          useMutate: useClientPhone
        }"
      />
    </template>
  </Loading>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useVModel } from "@vueuse/core";

// --- internal
import {
  useClientAddresses,
  useClientAddress,
  useClientPhones,
  useClientPhone,
  useBasketBilling
} from "@upmind-automation/headless";

// --- components
import Manage from "../../../components/manage/Manage.vue";
import Form from "../../../components/manage/Form.vue";
import { Loading } from "@upmind-automation/upmind-ui";

// --- utils
import { find, isString, set } from "lodash-es";

// --- types

import type { BillingModel } from "@upmind-automation/headless";
import AddressItem from "./AddressItem.vue";
import PhoneItem from "./PhoneItem.vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  modelValue?: BillingModel;
  readonly?: boolean;
}>();

const emits = defineEmits<{
  (e: "resolve", value: BillingModel): void;
  (e: "update:modelValue", value: BillingModel): void;
}>();

// -----------------------------------------------------------------------------

const { useUnifiedBillingDetail } = useBasketBilling();

const {
  data: addresses,
  meta: addressMeta,
  default: defaultAddress,
  isReady: isAddressesReady
} = useClientAddresses();

const {
  data: phones,
  meta: phoneMeta,
  default: defaultPhone,
  isReady: isPhonesReady
} = useClientPhones();

const meta = computed(() => ({
  isEmpty: addressMeta.value.isEmpty && phoneMeta.value.isEmpty,
  isLoading: addressMeta.value.isLoading || phoneMeta.value.isLoading
}));

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  deep: true,
  defaultValue: {
    addressId: defaultAddress.value?.id,
    phoneId: defaultPhone.value?.id
  }
});

// -----------------------------------------------------------------------------

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
  }
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
  }
});

// --- methods

function doResolve(value: BillingModel | string) {
  selectedPhone.value = isString(value)
    ? value
    : (value?.phoneId ?? defaultPhone.value?.id ?? undefined);

  selectedAddress.value = isString(value)
    ? value
    : (value?.addressId ?? defaultAddress.value?.id ?? undefined);

  if (modelValue.value) emits("resolve", modelValue.value as BillingModel);
}

// --- side effects

await Promise.all([isAddressesReady(), isPhonesReady()]).then(() => {
  // Ensure modelValue is initialized with default values
  modelValue.value = {
    addressId: modelValue.value?.addressId ?? defaultAddress.value?.id,
    phoneId: modelValue.value?.phoneId ?? defaultPhone.value?.id
  };

  if (!modelValue.value.addressId && !modelValue.value.phoneId) {
    doResolve(modelValue.value);
  }
});
</script>
