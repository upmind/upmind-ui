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
        :label="t('text.company')"
        v-model="selectedCompany"
        :manage="{
          useList: useClientCompanies,
          useMutate: useClientCompanyManager
        }"
        :show-label="!!selectedCompany"
        :readonly="readonly"
        :force-open="props.expand"
        @processing="wait"
        @resolve="
          (add: boolean) => {
            if (add) emit('formResolve');
          }
        "
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

        <template v-if="billingMeta.needsPhone" #additional>
          <Manage
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
            @resolve="
              (add: boolean) => {
                if (add) emit('formResolve');
              }
            "
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
      </Manage>
    </template>
  </div>
</template>

<script setup lang="ts">
import { vAutoAnimate } from "@formkit/auto-animate";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  useClientCompanies,
  useClientCompanyManager,
  useClientPhones,
  useClientPhoneManager,
  useBasketBilling
} from "@upmind-automation/headless";
import { UnifiedType } from "@upmind-automation/headless";
import Form from "../../../components/manage/Form.vue";
import Manage from "../../../components/manage/Manage.vue";
import CompanyItem from "./CompanyItem.vue";
import PhoneItem from "./PhoneItem.vue";
import { find } from "lodash-es";
import type { BillingModel } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<{
  expand?: boolean;
  modelValue?: BillingModel;
  readonly?: boolean;
  touched?: boolean;
}>();

const emit = defineEmits<{ formResolve: [] }>();
const modelValue = defineModel<BillingModel>("modelValue", {});

const showForm = ref(false);
const touched = defineModel<boolean>("touched");

// -----------------------------------------------------------------------------
const { t } = useI18n();

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

// -----------------------------------------------------------------------------

// --- context

const selectedCompany = computed({
  get() {
    return modelValue.value?.companyId ?? defaultCompany()?.id ?? undefined;
  },
  set(val?: string) {
    const found = find(companies.value, ["id", val]) ?? defaultCompany();
    modelValue.value = {
      ...modelValue.value,
      companyId: found?.id ?? val,
      addressId: found?.addressId
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
  const company =
    find(companies.value, ["id", value?.companyId]) ?? defaultCompany();
  modelValue.value = {
    phoneId: billingMeta.value.needsPhone
      ? (value?.phoneId ?? defaultPhone()?.id ?? undefined)
      : undefined,
    companyId: company?.id ?? value?.companyId,
    addressId: company?.addressId
  };
  showForm.value = false;
  emit("formResolve");
}

// --- side effects

await Promise.all([isCompaniesReady(), isPhonesReady()]).then(() => {
  // Set our initial / default values
  modelValue.value = {
    companyId: modelValue.value?.companyId ?? defaultCompany()?.id,
    addressId: modelValue.value?.addressId ?? defaultCompany()?.addressId,
    phoneId: billingMeta.value.needsPhone
      ? (modelValue.value?.phoneId ?? defaultPhone()?.id)
      : undefined
  };

  showForm.value = companyMeta.value.isEmpty && phoneMeta.value.isEmpty;
});
</script>
