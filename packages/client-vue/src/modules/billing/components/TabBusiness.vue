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
              useList: usePhoneListForManage,
              useMutate: usePhoneManagerForManage
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
  useClientCompanies,
  useClientCompanyManager,
  useClientPhones,
  useClientPhoneManager,
  useBasketBilling,
  ClientPhoneContextTypes,
  ScopeActorTypes
} from "@upmind-automation/headless";
import { UnifiedType } from "@upmind-automation/headless";
import Form from "../../../components/manage/Form.vue";
import Manage from "../../../components/manage/Manage.vue";
import CompanyItem from "./CompanyItem.vue";
import PhoneItem from "./PhoneItem.vue";
import { find } from "lodash-es";
import type {
  BillingModel,
  ScopeBuilderActorWithContexts,
  UseClientPhoneManagerActions,
  UseClientPhoneManagerContext,
  UseClientPhoneManagerInternals,
  UseClientPhoneManagerMeta
} from "@upmind-automation/headless";

// The scope builder's `SELF` matrix row is `null as never` (SELF resolves to
// a concrete actor at runtime — clause 4), so `.as(ScopeActorTypes.SELF)`
// alone does not statically carry `.for()` / `.fresh()` — every
// `.as('self').for(...)` JSDoc example across this codebase documents that
// shape, but nothing outside `__tests__` (untyped by vitest) has compiled it
// yet. This reconstructs the per-scope instance shape from its four
// published sub-composable types and asserts it — see the handoff report's
// escalation note.
type PhoneManagerInstance = {
  useActions: () => UseClientPhoneManagerActions;
  useContext: () => UseClientPhoneManagerContext;
  useInternals: () => UseClientPhoneManagerInternals;
  useMeta: () => UseClientPhoneManagerMeta;
};
type ScopedPhoneManager = ScopeBuilderActorWithContexts<
  PhoneManagerInstance,
  ClientPhoneContextTypes
>;

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

const clientPhones = useClientPhones().as(ScopeActorTypes.SELF);
const { isReady: isPhonesReady } = clientPhones.useActions();
const { data: phones, default: defaultPhone } = clientPhones.useContext();
const { isEmpty: phonesEmpty, isLoading: phonesLoading } =
  clientPhones.useMeta();

const meta = computed(() => ({
  isEmpty: companyMeta.value.isEmpty && phonesEmpty.value,
  isLoading: companyMeta.value.isLoading || phonesLoading.value
}));

// The `Manage` component's `useList` / `useMutate` props are called bare
// (`props.manage.useList()`, `props.manage.useMutate(id, options)`), so the
// scoped composables are wrapped here to that shape — forced by the
// four-layer return, not a behaviour change. Both wrap the SAME registry
// instance `clientPhones` above resolves (scoped composables are singletons
// per scope key), so nothing here mints a second collection.
function usePhoneListForManage() {
  const { remove, setDefault } = clientPhones.useActions();
  return {
    isReady: isPhonesReady,
    meta: computed(() => ({
      isLoading: phonesLoading.value,
      isEmpty: phonesEmpty.value
    })),
    data: phones,
    default: defaultPhone,
    remove,
    setDefault
  };
}

function usePhoneManagerForManage(id?: string) {
  const scoped = useClientPhoneManager().as(
    ScopeActorTypes.SELF
  ) as ScopedPhoneManager;
  const manager = id
    ? scoped.for(ClientPhoneContextTypes.PHONE, id)
    : scoped.fresh();
  const { isReady, update, clear, input, destroy } = manager.useActions();
  const { model, schema, uischema, errors, validationErrors } =
    manager.useContext();
  const managerMeta = manager.useMeta();

  return {
    isReady,
    meta: computed(() => ({
      isAvailable: managerMeta.isAvailable.value,
      isLoading: managerMeta.isLoading.value,
      isValid: managerMeta.isValid.value,
      isDirty: managerMeta.isDirty.value,
      isProcessing: managerMeta.isProcessing.value,
      hasErrors: managerMeta.hasErrors.value,
      isNew: managerMeta.isNew.value,
      isComplete: managerMeta.isComplete.value
    })),
    model,
    schema,
    uischema,
    errors,
    validationErrors,
    update,
    clear,
    input,
    // `destroy` in the `stop` slot: the kit's contract for this slot is
    // "release this editor", and `stop()` alone leaves the registry entry
    // behind for the life of the SPA session (W1). `destroy()` also
    // deregisters the scoped instance.
    stop: destroy
  };
}

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

  showForm.value = companyMeta.value.isEmpty && phonesEmpty.value;
});
</script>
