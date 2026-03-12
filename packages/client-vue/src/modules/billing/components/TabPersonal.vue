<template>
  <div v-if="!meta.isLoading" class="flex w-full flex-col gap-4">
    <Form
      v-if="showForm"
      i18nKey="form.address"
      :useMutate="useUnifiedBillingDetail"
      :modelValue="UnifiedType.PERSONAL"
      open
      :modal="false"
      @resolve="doResolve"
      v-model:touched="touched"
      :ui-config="{
        form: {
          root: ['gap-9']
        }
      }"
    />

    <template v-else>
      <Manage
        :label="t('text.address')"
        v-model="selectedAddress"
        :manage="{
          useList: useClientAddresses,
          useMutate: useClientAddressManager
        }"
        :show-label="!!selectedAddress"
        :readonly="readonly"
        :force-open="props.expand"
        @processing="wait"
        v-model:touched="touched"
      >
        <template #item="{ item, readonly, doEdit, doRemove }">
          <AddressItem
            v-bind="item"
            :readonly="readonly"
            @edit="doEdit"
            @remove="doRemove"
          />
        </template>
      </Manage>

      <Manage
        v-if="billingMeta.needsPhone"
        :label="t('text.phone')"
        v-model="selectedPhone"
        as="select"
        :manage="{
          useList: useClientPhones,
          useMutate: useClientPhoneManager
        }"
        :show-label="!!selectedPhone"
        :readonly="readonly"
        @processing="wait"
        v-model:touched="touched"
      >
        <template #item="{ item, readonly, doEdit, doRemove }">
          <PhoneItem
            v-bind="item"
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
import { useI18n } from "vue-i18n";
import { computed, ref } from "vue";

// --- internal
import {
  useClientAddresses,
  useClientAddressManager,
  useClientPhones,
  useClientPhoneManager,
  useBasketBilling
} from "@upmind-automation/headless";

// --- components
import Manage from "../../../components/manage/Manage.vue";
import Form from "../../../components/manage/Form.vue";

// --- utils
import { find } from "lodash-es";

// --- types
import { UnifiedType } from "@upmind-automation/headless";
import type { BillingModel } from "@upmind-automation/headless";
import AddressItem from "./AddressItem.vue";
import PhoneItem from "./PhoneItem.vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  expand?: boolean;
  modelValue?: BillingModel;
  readonly?: boolean;
  touched?: boolean;
}>();

const modelValue = defineModel<BillingModel>("modelValue", {});

const showForm = ref(false);
const touched = defineModel<boolean>("touched");

// -----------------------------------------------------------------------------
const { t } = useI18n();

const { useUnifiedBillingDetail, meta: billingMeta, wait } = useBasketBilling();

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

// -----------------------------------------------------------------------------

// --- context

const selectedAddress = computed({
  get() {
    return modelValue.value?.addressId ?? defaultAddress()?.id ?? undefined;
  },
  set(val?: string) {
    const found = find(addresses.value, ["id", val]) ?? defaultAddress();
    modelValue.value = {
      ...modelValue.value,
      companyId: undefined,
      addressId: found?.id ?? val
    };
  }
});

const selectedPhone = computed({
  get() {
    return modelValue.value?.phoneId ?? defaultPhone()?.id ?? undefined;
  },
  set(val?: string) {
    const found = find(phones.value, ["id", val]) ?? defaultPhone();

    modelValue.value = {
      ...modelValue.value,
      phoneId: found?.id ?? val
    };
  }
});
// --- methods

function doResolve(value: BillingModel) {
  modelValue.value = {
    phoneId: billingMeta.value.needsPhone
      ? (value?.phoneId ?? defaultPhone()?.id ?? undefined)
      : undefined,
    companyId: undefined,
    addressId: value?.addressId ?? defaultAddress()?.id ?? undefined
  };
  showForm.value = false;
}

// --- side effects

await Promise.all([isAddressesReady(), isPhonesReady()]).then(() => {
  // Set our initial / default values
  modelValue.value = {
    companyId: undefined,
    addressId: modelValue.value?.addressId ?? defaultAddress()?.id,
    phoneId: billingMeta.value.needsPhone
      ? (modelValue.value?.phoneId ?? defaultPhone()?.id)
      : undefined
  };

  showForm.value = addressMeta.value.isEmpty && phoneMeta.value.isEmpty;
});
</script>
