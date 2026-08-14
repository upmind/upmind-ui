<template>
  <UpmSections
    class="min-h-44"
    v-model="activeTab"
    :sections="sections"
    data-test-key="billing"
  >
    <template v-slot:[`section-address`]>
      <UpmManage
        i18n-key="form.address"
        v-model="defaultAddressValue"
        :force-open="true"
        :manage="{
          useList: useClientAddresses,
          useMutate: useClientAddressManager
        }"
      >
        <template #item="{ item, readonly, doEdit, doRemove, setDefault }">
          <AddressItem
            v-bind="item"
            :readonly="readonly"
            @edit="doEdit"
            @remove="doRemove"
            @setDefault="setDefault"
          />
        </template>
      </UpmManage>
    </template>

    <template v-slot:[`section-business`]>
      <UpmManage
        i18n-key="form.company"
        v-model="defaultCompanyValue"
        :force-open="true"
        :manage="{
          useList: useCompanyList,
          useMutate: useCompanyMutate
        }"
      >
        <template #item="{ item, readonly, doEdit, doRemove, setDefault }">
          <CompanyItem
            v-bind="item"
            :readonly="readonly"
            @edit="doEdit"
            @remove="doRemove"
            @setDefault="setDefault"
          />
        </template>
      </UpmManage>
    </template>
  </UpmSections>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { UpmManage, UpmSections } from "@upmind-automation/client-vue";
import {
  ClientCompanyContextTypes,
  ScopeActorTypes,
  useClientAddresses,
  useClientAddressManager,
  useClientCompanies,
  useClientCompanyManager,
  useActiveSession
} from "@upmind-automation/headless";
import AddressItem from "./AddressItem.vue";
import CompanyItem from "./CompanyItem.vue";
import { sortBy } from "lodash-es";
import type { TabItem } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    skipAuth?: boolean;
  }>(),
  {
    skipAuth: false
  }
);

const { t } = useI18n();

if (!props.skipAuth) {
  await useActiveSession().useActions().isAuthenticated();
}

const companiesScope = useClientCompanies().as(ScopeActorTypes.CLIENT);
const { default: defaultCompany } = companiesScope.useContext();
const { isEmpty: isCompaniesEmpty } = companiesScope.useMeta();
const { isReady: isCompaniesReady } = companiesScope.useActions();

const { isReady: isAddressesReady, default: defaultAddress } =
  useClientAddresses();

await Promise.all([isAddressesReady(), isCompaniesReady()]);

const defaultAddressValue = ref(defaultAddress()?.id);
const defaultCompanyValue = ref(defaultCompany());

const sections = computed<TabItem[]>(() => {
  const tabs = [
    {
      label: t("text.companies"),
      value: "business"
    },
    {
      label: t("text.personal"),
      value: "address"
    }
  ];

  // Sort so that "company" comes first if we have companies
  return sortBy(tabs, tab => {
    if (isCompaniesEmpty.value) {
      return tab.value === "address" ? 0 : 1;
    }
    return tab.label;
  });
});

const activeTab = ref(isCompaniesEmpty.value ? "address" : "business");

// `UpmManage` expects the flat `MinimalListComposable` / `MinimalMutateComposable`
// shape; `useClientCompanies` / `useClientCompanyManager` are SCOPED, so these
// adapters resolve `.as(CLIENT)` and flatten the four-layer return
// (`design.md` D9).
function useCompanyList() {
  const { data } = companiesScope.useContext();
  const { isLoading, hasError, isEmpty } = companiesScope.useMeta();
  const { isReady, remove, setDefault } = companiesScope.useActions();

  return {
    isReady,
    meta: computed(() => ({
      isLoading: isLoading.value,
      hasError: hasError.value,
      isEmpty: isEmpty.value
    })),
    data,
    default: defaultCompany,
    remove,
    setDefault
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
    stop: destroy
  };
}
</script>
