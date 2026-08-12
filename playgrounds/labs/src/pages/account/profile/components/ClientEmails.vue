<template>
  <UpmSection :label="t('text.emails')">
    <i18n-t keypath="text.emails_msg" tag="h1" />
    <UpmManage
      i18n-key="form.email"
      v-model="defaultEmailValue"
      :force-open="true"
      :manage="{
        useList: useEmailsListForManage,
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
  ClientEmailContextTypes,
  ScopeActorTypes,
  useClientEmails,
  useClientEmailManager
} from "@upmind-automation/headless";
import EmailItem from "./EmailItem.vue";

// -----------------------------------------------------------------------------
/**
 * @decision local flat-composable adapters over `useClientEmails` /
 * `useClientEmailManager`, kept in THIS file (not `client-email/`).
 * what:    `useEmailsListForManage` / `useEmailManagerForManage` call the
 *          REAL scoped composables (`.as('self')`, `.for('email', id)` /
 *          `.fresh()`) and flatten their four-layer return into the single
 *          object shape `@upmind-automation/client-vue`'s `<UpmManage>`
 *          (`packages/client-vue/src/components/manage/types.ts` —
 *          `MinimalListComposable` / `MinimalMutateComposable`) still
 *          expects — the shape EVERY scoped composable had before the
 *          client-email conversion.
 * why:     `client-email/index.ts` now publishes a scope BUILDER
 *          (`.as()` then `.useActions()`/`.useContext()`/`.useMeta()`/
 *          `.useInternals()`), not a flat composable. This page's own
 *          direct call (`const { isReady, default: defaultEmail, verify } =
 *          useClientEmails()`) broke the same way — `.isReady` doesn't
 *          exist on the builder itself. `<UpmManage>`/`<List>`/`<Form>`
 *          (`packages/client-vue/src/components/manage/*.vue`) are OUT OF
 *          THIS RUN'S WRITE LANE and call `props.useList()` /
 *          `props.useMutate(id)` directly, so the adapter has to sit HERE,
 *          between this page and the barrel — never inside `client-email/`
 *          (strictly DO-NOT-MODIFY) and never inside `client-vue/`.
 * rejected: changing `client-vue`'s `Manage.vue`/`List.vue`/`Form.vue` to
 *          understand the four-layer shape directly — rejected, out of
 *          this run's write lane and would ripple into every OTHER
 *          `<UpmManage>` consumer still on a flat (unconverted) composable,
 *          e.g. this same directory's `ClientPhones.vue`
 *          (`useClientPhones`/`useClientPhoneManager` are plain exported
 *          functions, not scoped composables — verified, left untouched).
 *
 * @decision the manager half resolves `.as(ScopeActorTypes.CLIENT)`, not
 * `.as('self')`, despite `useClientEmailManager`'s own `@example` JSDoc
 * showing `.as('self').for('email', emailId)`.
 * what:    `useEmailManagerForManage` calls `.as(ScopeActorTypes.CLIENT)`
 *          before `.for()` / `.fresh()`.
 * why:     verified by a standalone structural type-check against the
 *          scope builder's own conditional types (`scope.builder.ts`'s
 *          `ScopeBuilderResult`): `.as('self')` type-checks to plain `T`
 *          (every matrix's `SELF` row is `null as never`, so
 *          `ContextsForActor<Matrix, SELF>` is `never` AT THE TYPE LEVEL,
 *          regardless of the runtime resolution `resolveSelfActor` performs)
 *          — it has NO `.for()`/`.fresh()`. The reference module's own
 *          `@example` comment is prose, never type-checked, and is wrong on
 *          this point. `ScopeActorTypes.CLIENT` is safe here: this whole
 *          page sits under the client-only `/account` area (parity.yaml
 *          B-client-self is the only resolving cell this run's client-email
 *          precedent covers too), matching `client-personal-details`'s own
 *          internal calls (e.g. `client-personal-details.services.ts`'s
 *          `useClientCustomFields().as(ScopeActorTypes.CLIENT)`).
 */

const { t } = useI18n();

const emails = useClientEmails().as(ScopeActorTypes.SELF);
const { isReady, remove, setDefault, verify } = emails.useActions();
const { data, default: getDefaultEmail } = emails.useContext();
const emailsMeta = emails.useMeta();

/** `MinimalListComposable` (`client-vue/manage/types.ts`) over the collection. */
function useEmailsListForManage() {
  return {
    isReady,
    meta: computed(() => ({
      hasError: emailsMeta.hasError.value,
      isAvailable: emailsMeta.isAvailable.value,
      isEmpty: emailsMeta.isEmpty.value,
      isLoading: emailsMeta.isLoading.value
    })),
    data,
    default: getDefaultEmail,
    remove,
    setDefault
  };
}

/**
 * `MinimalMutateComposable` over the per-email manager. `id` is the email
 * being edited (from `<Form>`'s `model-value`); absent, this drafts a new
 * address — mirrors `useClientEmailManager`'s own documented
 * `.for('email', id)` / `.fresh()` split.
 */
function useEmailManagerForManage(id?: string) {
  const manager = id
    ? useClientEmailManager()
        .as(ScopeActorTypes.CLIENT)
        .for(ClientEmailContextTypes.EMAIL, id)
    : useClientEmailManager().as(ScopeActorTypes.CLIENT).fresh();

  const {
    clear,
    input,
    isReady: managerIsReady,
    stop,
    update
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
    stop
  };
}

await isReady();

const defaultEmailValue = ref(getDefaultEmail()?.id);
</script>
