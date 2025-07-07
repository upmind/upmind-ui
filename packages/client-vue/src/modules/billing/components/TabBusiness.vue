<template>
  <div v-if="!meta.isLoading" class="w-full">
    <Form
      v-if="showForm"
      i18nKey="client.company"
      :useMutate="useUnifiedBillingDetail"
      :modelValue="UnifiedType.BUSINESS"
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
      >
        <template #item="{ item, readonly, doEdit, doRemove }">
          <CompanyItem
            v-bind="item"
            :i18nKey="'client.company'"
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
        as="select"
        class="p-0"
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
  useClientCompanies,
  useClientCompany,
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
import CompanyItem from "./CompanyItem.vue";
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
    phoneId: billingMeta.value.needsPhone ? defaultPhone.value?.id : undefined
  }
});

// -----------------------------------------------------------------------------

// --- context

const selectedCompany = computed({
  get() {
    return modelValue.value?.companyId ?? undefined;
  },
  set(val?: string) {
    modelValue.value ??= {};
    const found = find(companies.value, { id: val });
    set(modelValue.value, "companyId", found?.id);
    set(modelValue.value, "addressId", found?.addressId);
  }
});

const selectedPhone = computed({
  get() {
    return modelValue.value?.phoneId ?? undefined;
  },
  set(val: string | undefined) {
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

  selectedCompany.value =
    value?.companyId ?? defaultCompany.value?.id ?? undefined;

  showForm.value = false;
}

// --- side effects

await Promise.all([isCompaniesReady(), isPhonesReady()]).then(() => {
  // Ensure modelValue is initialized with default values
  modelValue.value = {
    companyId: modelValue.value?.companyId ?? defaultCompany.value?.id,
    addressId: modelValue.value?.addressId ?? defaultCompany.value?.addressId,
    phoneId: billingMeta.value.needsPhone
      ? (modelValue.value?.phoneId ?? defaultPhone.value?.id)
      : undefined
  };

  showForm.value = companyMeta.value.isEmpty && phoneMeta.value.isEmpty;
});
</script>
