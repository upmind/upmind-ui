<template>
  <UpmSection :label="t('text.personal_details')">
    <i18n-t keypath="text.personal_details_msg" tag="h1" />

    <pre>{{ meta }}</pre>

    <Alert v-if="meta.hasErrors" type="error" class="mb-4">
      <pre>{{ errors }}</pre>
    </Alert>

    <UpmForm
      v-if="!meta.isLoading"
      :additional-errors="validationErrors"
      :model-value="model"
      :schema="schema"
      :uischema="uischema"
      :touched="meta.showErrors"
      :processing="meta.isProcessing"
      :loading="meta.isLoading"
      :actions="actions"
      @reject="reject"
      @resolve="resolve"
      @update:modelValue="input"
    />
    <pre>{{ model }}</pre>
  </UpmSection>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, reactive } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { UpmSection, UpmForm } from "@upmind-automation/client-vue";
import {
  ScopeActorTypes,
  usePersonalDetailsManager
} from "@upmind-automation/headless";
import { Alert } from "@upmind/ui";
import type { FormActionProps } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    fields: string[];
    profileRoute?: string;
  }>(),
  {
    profileRoute: "account.profile"
  }
);

// -----------------------------------------------------------------------------

const { t } = useI18n();
const router = useRouter();

// `.fresh()` mints an independent editor instance per mount — the same
// lifetime the pre-scope factory function gave every call. `filterFields()`
// is this module's own scope-factory-argument equivalent of the pre-scope
// `{ filterFields }` option (design.md §8, `usePersonalDetailsManager.ts`'s
// own `@decision`); called before `await isReady()` so the narrowed schema
// is what the form's first render settles on.
//
// `.as(ScopeActorTypes.CLIENT)`, not `.as('self')`: verified by a standalone
// structural type-check that `.as('self')` type-checks to plain `T` (every
// matrix's `SELF` row is `null as never`), so it carries no `.fresh()` —
// `ClientEmails.vue`'s own `@decision` in this same directory has the full
// trace. This page sits under the client-only `/account` area, so the
// actor is never ambiguous.
const manager = usePersonalDetailsManager().as(ScopeActorTypes.CLIENT).fresh();
const { errors, model, schema, uischema, validationErrors } =
  manager.useContext();
// `useMeta()` returns flat computeds, not a single reactive object —
// `reactive()` here is what makes the template's existing `meta.x` paths
// (kept as-is, AC-60) unwrap reactively without a template rewrite.
const meta = reactive(manager.useMeta());
const {
  update,
  input,
  clear: _clear,
  isReady,
  destroy,
  filterFields
} = manager.useActions();

filterFields(props.fields);

const actions = computed((): Record<string, FormActionProps> => {
  return {
    submit: {
      type: "submit",
      label: t("action.apply"),
      size: "lg",
      variant: "primary",
      needsValid: true
    },
    cancel: {
      type: "reset",
      label: t("action.cancel"),
      size: "lg",
      variant: "subtle"
    }
  };
});

await isReady();

function resolve() {
  update()
    .then(reject)
    .catch(() => {
      // show error?
    });
}

function reject() {
  router.push({ name: props.profileRoute });
}

// `.fresh()` gave this instance no other referrer — `destroy()` (stop +
// deregister) rather than `stop()` (pause only) is what keeps a `.fresh()`
// registry entry from accumulating across remounts.
onBeforeUnmount(() => {
  destroy();
});
</script>
