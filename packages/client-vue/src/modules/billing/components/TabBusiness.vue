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
          useList: useCompanyList,
          useMutate: useCompanyMutate
        }"
        :show-label="!!selectedCompany"
        :readonly="readonly"
        :force-open="props.expand"
        @processing="wait"
        @resolve="() => emit('formResolve')"
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
            @resolve="() => emit('formResolve')"
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
  ClientCompanyContextTypes,
  ScopeActorTypes,
  useClientCompanies,
  useClientCompanyManager,
  useClientPhones,
  useClientPhoneManager,
  useBasketBilling,
  useFeedback
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

const companiesScope = useClientCompanies().as(ScopeActorTypes.CLIENT);
const {
  data: companies,
  default: defaultCompany,
  getOne: getCompany
} = companiesScope.useContext();
const { isEmpty: isCompaniesEmpty, isLoading: isCompaniesLoading } =
  companiesScope.useMeta();
const { isReady: isCompaniesReady } = companiesScope.useActions();

const {
  data: phones,
  meta: phoneMeta,
  default: defaultPhone,
  isReady: isPhonesReady
} = useClientPhones();

const meta = computed(() => ({
  isEmpty: isCompaniesEmpty.value && phoneMeta.value.isEmpty,
  isLoading: isCompaniesLoading.value || phoneMeta.value.isLoading
}));

// --- Manage-renderer adapters — `useClientCompanies` / `useClientCompanyManager`
// are SCOPED composables; the `Manage`/`Form` components below expect the flat
// `MinimalListComposable` / `MinimalMutateComposable` shape
// (`components/manage/types.ts`), so these resolve `.as(CLIENT)` and flatten
// the four-layer return into that shape (`design.md` D9).
//
// `remove` / `setDefault` also carry the AC-29 consumer obligation: the module
// raises no feedback of its own, so the toasts the legacy raised on delete and
// on set-default are rendered HERE instead (`parity.yaml` C32).
const { addSuccess, addError } = useFeedback();

function useCompanyList() {
  const { remove, setDefault } = companiesScope.useActions();

  return {
    isReady: isCompaniesReady,
    meta: computed(() => ({
      isLoading: isCompaniesLoading.value,
      isEmpty: isCompaniesEmpty.value
    })),
    data: companies,
    default: defaultCompany,
    remove: (id: string) =>
      remove(id)
        .then(() => addSuccess(t("confirm.company_removed")))
        .catch(error =>
          addError({
            title: error?.message ?? t("error.client_company_delete_failed")
          })
        ),
    setDefault: (id: string) =>
      setDefault(id)
        .then(() => addSuccess(t("confirm.company_set_default")))
        .catch(error =>
          addError({
            title:
              error?.message ?? t("error.client_company_set_default_failed")
          })
        )
  };
}

function useCompanyMutate(id?: string) {
  const manager = useClientCompanyManager().as(ScopeActorTypes.CLIENT);
  const instance = id
    ? manager.for(ClientCompanyContextTypes.COMPANY, id)
    : manager.fresh();
  const { isReady, update, clear, input, destroy } = instance.useActions();
  const { model, schema, uischema, errors, validationErrors } =
    instance.useContext();
  const {
    isAvailable,
    isLoading,
    isValid,
    isDirty,
    isProcessing,
    hasErrors,
    isNew,
    isComplete
  } = instance.useMeta();

  return {
    isReady,
    meta: computed(() => ({
      isAvailable: isAvailable.value,
      isLoading: isLoading.value,
      isValid: isValid.value,
      isDirty: isDirty.value,
      isProcessing: isProcessing.value,
      hasErrors: hasErrors.value,
      isNew: isNew.value,
      isComplete: isComplete.value
    })),
    model,
    schema,
    uischema,
    errors,
    validationErrors,
    update,
    clear,
    input,
    // `Form.vue` calls `stop()` on close and `onUnmounted` — mapping it to
    // `destroy()` is the AC-24 lifecycle obligation: without it, every
    // company opened would leave a permanent registry entry holding a live
    // TanStack observer at `staleTime: DAY`.
    stop: destroy
  };
}

// -----------------------------------------------------------------------------

// --- context

const selectedCompany = computed({
  get() {
    return modelValue.value?.companyId ?? defaultCompany() ?? undefined;
  },
  set(val?: string) {
    const found =
      find(companies.value, ["id", val]) ?? getCompany(defaultCompany());
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
    find(companies.value, ["id", value?.companyId]) ??
    getCompany(defaultCompany());
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
    companyId: modelValue.value?.companyId ?? defaultCompany(),
    addressId:
      modelValue.value?.addressId ?? getCompany(defaultCompany())?.addressId,
    phoneId: billingMeta.value.needsPhone
      ? (modelValue.value?.phoneId ?? defaultPhone()?.id)
      : undefined
  };

  showForm.value = isCompaniesEmpty.value && phoneMeta.value.isEmpty;
});
</script>
