<template>
  <UpmLayout>
    <UpmSection class="max-w-app mx-auto" label="Addresses">
      <UpmManage
        v-if="isAuthenticated"
        i18n-key="form.address"
        :manage="{
          useList: useAddressList,
          useMutate: useAddressMutate
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
  ClientAddressContextTypes,
  ScopeActorTypes,
  useActiveSession,
  useClientAddresses,
  useClientAddressManager
} from "@upmind-automation/headless";

// --- components

// -----------------------------------------------------------------------------

const { isAuthenticated } = useActiveSession().useMeta();

const addressesScope = useClientAddresses().as(ScopeActorTypes.CLIENT);

// `UpmManage` calls `useList()` / `useMutate(id)` BARE and expects the flat
// `MinimalListComposable` / `MinimalMutateComposable` shape, so the scoped
// composables are adapted here. `default` re-hydrates to the ROW (the module's
// own `default()` is the id under R5) and `stop` maps to `destroy`; neither
// adapter raises feedback, because `client-address` still raises its own.
function useAddressList() {
  const {
    data,
    default: defaultAddressId,
    getOne
  } = addressesScope.useContext();
  const { isLoading, hasError, isEmpty } = addressesScope.useMeta();
  const { isReady, remove, setDefault } = addressesScope.useActions();

  return {
    isReady,
    meta: computed(() => ({
      isLoading: isLoading.value,
      hasError: hasError.value,
      isEmpty: isEmpty.value
    })),
    data,
    default: () => getOne(defaultAddressId()),
    remove,
    setDefault
  };
}

function useAddressMutate(id?: string) {
  const manager = useClientAddressManager().as(ScopeActorTypes.CLIENT);
  const instance = id
    ? manager.for(ClientAddressContextTypes.ADDRESS, id)
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
