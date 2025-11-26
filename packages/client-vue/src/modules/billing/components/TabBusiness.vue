<template>
  <div v-if="!meta.isLoading" class="flex w-full flex-col gap-4" v-auto-animate>
    <Form
      v-if="showForm"
      i18nKey="form.company"
      :useMutate="useUnifiedBillingDetail"
      :modelValue="UnifiedType.BUSINESS"
      open
      :modal="false"
      @resolve="doResolve"
      v-model:touched="touched"
    />

    <template v-else>
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

      <Manage
        :label="t('text.company')"
        v-model="selectedCompany"
        :manage="{
          useList: useClientCompanies,
          useMutate: useClientCompanyManager
        }"
        :show-label="!!selectedCompany"
        @processing="wait"
        v-model:touched="touched"
      >
        <template #item="{ item, readonly, doEdit, doRemove }">
          <CompanyItem
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
import { useVModel } from "@vueuse/core";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import {
  useClientCompanies,
  useClientCompanyManager,
  useClientPhones,
  useClientPhoneManager,
  useBasketBilling
} from "@upmind-automation/headless";

// --- components
import Manage from "../../../components/manage/Manage.vue";
import Form from "../../../components/manage/Form.vue";

// --- utils
import { find, set } from "lodash-es";

// --- types
import { UnifiedType } from "@upmind-automation/headless";
import type { BillingModel, Company, Phone } from "@upmind-automation/headless";
import CompanyItem from "./CompanyItem.vue";
import PhoneItem from "./PhoneItem.vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  modelValue?: BillingModel;
  readonly?: boolean;
  touched?: boolean;
}>();

const { t } = useI18n();

const emits = defineEmits<{
  (e: "update:modelValue", value: BillingModel): void;
}>();

const showForm = ref(false);
const touched = defineModel<boolean>("touched");

// -----------------------------------------------------------------------------

const { useUnifiedBillingDetail, meta: billingMeta, wait } = useBasketBilling();

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
    companyId: defaultCompany()?.id,
    addressId: defaultCompany()?.addressId,
    phoneId: billingMeta.value.needsPhone ? defaultPhone()?.id : undefined
  }
});

// -----------------------------------------------------------------------------

// --- context

const selectedCompany = computed({
  get() {
    return modelValue.value?.companyId ?? defaultCompany()?.id ?? undefined;
  },
  set(val?: string) {
    modelValue.value ??= {};
    const found = find(companies.value, ["id", val]) ?? defaultCompany();
    set(modelValue.value, "companyId", found?.id);
    set(modelValue.value, "addressId", found?.addressId);
  }
});

const selectedPhone = computed<string | undefined>({
  get() {
    return modelValue.value?.phoneId ?? defaultPhone()?.id ?? undefined;
  },
  set(val?: string) {
    modelValue.value ??= {};
    const found = (find(phones.value, ["id", val]) ?? defaultPhone()) as
      | Phone
      | undefined;
    set(modelValue.value, "phoneId", found?.id ?? undefined);
  }
});

// --- methods

function doResolve(value: BillingModel) {
  selectedPhone.value = billingMeta.value.needsPhone
    ? (value?.phoneId ?? defaultPhone()?.id ?? undefined)
    : undefined;

  selectedCompany.value = value?.companyId ?? defaultCompany()?.id ?? undefined;

  showForm.value = false;
}

// --- side effects

await Promise.all([isCompaniesReady(), isPhonesReady()]).then(() => {
  // Ensure modelValue is initialized with default values
  selectedCompany.value = modelValue.value?.companyId ?? undefined;
  selectedPhone.value = billingMeta.value.needsPhone
    ? (modelValue.value?.phoneId ?? undefined)
    : undefined;

  showForm.value = companyMeta.value.isEmpty && phoneMeta.value.isEmpty;
});
</script>
