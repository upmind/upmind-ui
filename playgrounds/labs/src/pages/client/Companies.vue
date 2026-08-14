<template>
  <UpmLayout>
    <UpmSection class="max-w-app mx-auto" label="Companies">
      <UpmManage
        v-if="isAuthenticated"
        i18n-key="form.company"
        :manage="{
          useList: useCompanyList,
          useMutate: useCompanyMutate
        }"
      />
    </UpmSection>
  </UpmLayout>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import {
  UpmManage,
  UpmSection,
  UpmLayout
} from "@upmind-automation/client-vue";
import {
  ClientCompanyContextTypes,
  ScopeActorTypes,
  useActiveSession,
  useClientCompanies,
  useClientCompanyManager
} from "@upmind-automation/headless";

// --- components

// -----------------------------------------------------------------------------

const { isAuthenticated } = useActiveSession().useMeta();

// `UpmManage` expects the flat `MinimalListComposable` / `MinimalMutateComposable`
// shape; `useClientCompanies` / `useClientCompanyManager` are SCOPED, so these
// adapters resolve `.as(CLIENT)` and flatten the four-layer return
// (`design.md` D9).
function useCompanyList() {
  const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
  const { data, default: defaultCompany } = companies.useContext();
  const { isLoading, hasError, isEmpty } = companies.useMeta();
  const { isReady, remove, setDefault } = companies.useActions();

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
