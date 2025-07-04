<template>
  <Loading :active="meta.isLoading" class="w-full">
    <Form
      v-if="meta.isEmpty"
      i18nKey="client.company"
      :useMutate="useUnifiedBillingDetail"
      open
      :modal="false"
      @resolve="doResolve"
    />

    <template v-else>
      <Manage
        i18n-key="client.company"
        v-model="selectedCompany"
        :manage="{
          useList: useClientCompanies,
          useMutate: useClientCompany
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
  useClientCompanies,
  useClientCompany,
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
import CompanyItem from "./CompanyItem.vue";
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
  data: companies,
  meta: companyMeta,
  default: defaultCompany,
  isReady: isCompaniesReady
} = useClientCompanies();

const {
  data: phones,
  meta: phoneMeta,
  default: defaultPhone,
  isReady: isPhonesReady
} = useClientPhones();

const meta = computed(() => ({
  isEmpty: companyMeta.value.isEmpty && phoneMeta.value.isEmpty,
  isLoading: companyMeta.value.isLoading || phoneMeta.value.isLoading
}));

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  deep: true,
  defaultValue: {
    companyId: defaultCompany.value?.id,
    addressId: defaultCompany.value?.addressId,
    phoneId: defaultPhone.value?.id
  }
});

// -----------------------------------------------------------------------------

// --- context

const selectedCompany = computed<string | undefined>({
  get() {
    return modelValue.value?.companyId ?? undefined;
  },
  set(val: string | undefined) {
    modelValue.value ??= {};
    const found = find(companies.value, { id: val });
    if (found) {
      set(modelValue.value, "companyId", found.id);
      set(modelValue.value, "addressId", found.addressId);
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

  selectedCompany.value = isString(value)
    ? value
    : (value?.companyId ?? defaultCompany.value?.id ?? undefined);

  if (modelValue.value) emits("resolve", modelValue.value as BillingModel);
}

// --- side effects

await Promise.all([isCompaniesReady(), isPhonesReady()]).then(() => {
  // Ensure modelValue is initialized with default values
  modelValue.value = {
    companyId: modelValue.value?.companyId ?? defaultCompany.value?.id,
    addressId: modelValue.value?.addressId ?? defaultCompany.value?.addressId,
    phoneId: modelValue.value?.phoneId ?? defaultPhone.value?.id
  };

  if (!modelValue.value.companyId && !modelValue.value.phoneId) {
    doResolve(modelValue.value);
  }
});
</script>
