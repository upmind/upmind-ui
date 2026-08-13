<template>
  <UpmSection :label="t('text.emails')">
    <i18n-t keypath="text.emails_msg" tag="h1" />
    <UpmManage
      i18n-key="form.email"
      v-model="defaultEmailValue"
      :force-open="true"
      :manage="{
        useList: useEmailListForManage,
        useMutate: useEmailManagerForManage
      }"
    >
      <template #item="{ item, readonly, doEdit, doRemove, setDefault }">
        <EmailItem
          v-bind="item"
          :readonly="readonly"
          @edit="doEdit"
          @remove="doRemove"
          @verify="verify"
          @setDefault="setDefault"
        />
      </template>
    </UpmManage>
  </UpmSection>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { UpmSection, UpmManage } from "@upmind-automation/client-vue";
import {
  useClientEmails,
  useClientEmailManager,
  ClientEmailContextTypes,
  ScopeActorTypes
} from "@upmind-automation/headless";
import EmailItem from "./EmailItem.vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const clientEmails = useClientEmails().as(ScopeActorTypes.SELF);
const { isReady, verify } = clientEmails.useActions();
const { default: defaultEmail } = clientEmails.useContext();

await isReady();

const defaultEmailValue = ref(defaultEmail()?.id);

// `UpmManage`'s `useList` / `useMutate` props are called bare
// (`props.manage.useList()`, `props.manage.useMutate(id, options)`), so the
// scoped composables are wrapped here to that shape — forced by the
// four-layer return, not a behaviour change. Both wrap the SAME registry
// instance `clientEmails` above resolves (scoped composables are singletons
// per scope key), so nothing here mints a second collection.
function useEmailListForManage() {
  const {
    isReady: listIsReady,
    remove,
    setDefault
  } = clientEmails.useActions();
  const { data, default: defaultItem } = clientEmails.useContext();
  const { isLoading, isEmpty } = clientEmails.useMeta();

  return {
    isReady: listIsReady,
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

function useEmailManagerForManage(id?: string) {
  // `.as(ScopeActorTypes.CLIENT)` rather than `.as(SELF)`: on a matrix whose
  // `SELF` row is `null as never`, `.as(SELF)` degrades to plain `T` and does
  // not statically carry `.for()` / `.fresh()`. `CLIENT` is the actor that
  // actually resolves here, so naming it directly both typechecks and states
  // the intent — no cast, no reconstructed instance type.
  const scoped = useClientEmailManager().as(ScopeActorTypes.CLIENT);
  const manager = id
    ? scoped.for(ClientEmailContextTypes.EMAIL, id)
    : scoped.fresh();
  const {
    isReady: managerIsReady,
    update,
    clear,
    input,
    destroy
  } = manager.useActions();
  const { model, schema, uischema, errors, validationErrors } =
    manager.useContext();
  const managerMeta = manager.useMeta();

  return {
    isReady: managerIsReady,
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
    // behind for the life of the SPA session. `destroy()` also deregisters
    // the scoped instance.
    stop: destroy
  };
}
</script>
