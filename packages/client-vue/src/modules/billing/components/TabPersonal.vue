<template>
  <div v-if="!meta.isLoading" class="w-full">
    <Form
      v-if="showForm"
      i18nKey="client.address"
      :useMutate="useUnifiedBillingDetail"
      :modelValue="UnifiedType.PERSONAL"
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
      >
        <template #item="{ item, readonly, doEdit, doRemove }">
          <AddressItem
            v-bind="item"
            :i18nKey="'client.address'"
            :readonly="readonly"
            @edit="doEdit"
            @remove="doRemove"
          />
        </template>
      </Manage>

      <Manage
        v-if="billingMeta.needsPhone"
        i18n-key="client.phone"
        v-model="selectedPhone"
        minimal
        :manage="{
          useList: useClientPhones,
          useMutate: useClientPhone
        }"
      >
        <template #item="{ item, readonly, doEdit, doRemove }">
          <PhoneItem
            v-bind="item"
            :i18nKey="'client.phone'"
            :readonly="readonly"
            @edit="doEdit"
            @remove="doRemove"
          />
        </template>
      </Manage>
    </template>
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, ref } from "vue";
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

// --- utils
import { find, set } from "lodash-es";

// --- types
import { UnifiedType } from "@upmind-automation/headless";
import type { BillingModel, Phone } from "@upmind-automation/headless";
import AddressItem from "./AddressItem.vue";
import PhoneItem from "./PhoneItem.vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  modelValue?: BillingModel;
  readonly?: boolean;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: BillingModel): void;
}>();

const showForm = ref(false);
// -----------------------------------------------------------------------------

const { useUnifiedBillingDetail, meta: billingMeta } = useBasketBilling();

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
    companyId: undefined,
    addressId: defaultAddress.value?.id,
    phoneId: billingMeta.value.needsPhone ? defaultPhone.value?.id : undefined
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

    // nb ensure we  clear out
    set(modelValue.value, "companyId", undefined);

    const found = find(addresses.value, { id: val });

    set(modelValue.value, "addressId", found?.id);
  }
});

const selectedPhone = computed<string | undefined>({
  get() {
    return modelValue.value?.phoneId ?? undefined;
  },
  set(val?: string) {
    modelValue.value ??= {};
    const found = find(phones.value, { id: val }) as Phone | undefined;
    set(modelValue.value, "phoneId", found?.id ?? undefined);
  }
});

// --- methods

function doResolve(value: BillingModel) {
  selectedPhone.value = billingMeta.value.needsPhone
    ? (value?.phoneId ?? defaultPhone.value?.id ?? undefined)
    : undefined;

  selectedAddress.value =
    value?.addressId ?? defaultAddress.value?.id ?? undefined;

  showForm.value = false;
}

// --- side effects

await Promise.all([isAddressesReady(), isPhonesReady()]).then(() => {
  // Ensure modelValue is initialized with default values
  modelValue.value = {
    companyId: undefined,
    addressId: modelValue.value?.addressId ?? defaultAddress.value?.id,
    phoneId: billingMeta.value.needsPhone
      ? (modelValue.value?.phoneId ?? defaultPhone.value?.id)
      : undefined
  };

  showForm.value = addressMeta.value.isEmpty && phoneMeta.value.isEmpty;
});
</script>
