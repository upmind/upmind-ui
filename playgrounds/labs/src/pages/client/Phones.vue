<template>
  <UpmLayout>
    <UpmSection class="max-w-app mx-auto" label="Phones">
      <UpmManage
        v-if="isAuthenticated"
        i18n-key="client.phone"
        :manage="{
          useList: usePhoneListForManage,
          useMutate: usePhoneManagerForManage
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
  UpmLayout,
  useActiveSession
} from "@upmind-automation/client-vue";
import {
  useClientPhones,
  useClientPhoneManager,
  ClientPhoneContextTypes,
  ScopeActorTypes
} from "@upmind-automation/headless";
import type {
  ScopeBuilderActorWithContexts,
  UseClientPhoneManagerActions,
  UseClientPhoneManagerContext,
  UseClientPhoneManagerInternals,
  UseClientPhoneManagerMeta
} from "@upmind-automation/headless";

// --- components

// -----------------------------------------------------------------------------

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

const { isAuthenticated } = useActiveSession().useMeta();

// `UpmManage`'s `useList` / `useMutate` props are called bare
// (`props.manage.useList()`, `props.manage.useMutate(id, options)`), so the
// scoped composables are wrapped here to that shape — forced by the
// four-layer return, not a behaviour change.
function usePhoneListForManage() {
  const clientPhones = useClientPhones().as(ScopeActorTypes.SELF);
  const { isReady, remove, setDefault } = clientPhones.useActions();
  const { data, default: defaultItem } = clientPhones.useContext();
  const { isLoading, isEmpty } = clientPhones.useMeta();

  return {
    isReady,
    meta: computed(() => ({
      isLoading: isLoading.value,
      isEmpty: isEmpty.value
    })),
    data,
    default: defaultItem,
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
</script>
