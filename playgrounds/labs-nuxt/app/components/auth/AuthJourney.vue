<template>
  <div class="flex flex-col gap-4">
    <template v-if="!isAuthenticated">
      <Alert
        v-if="hasErrors && hasForm"
        variant="danger"
        :title="alertTitle"
        :description="errors"
        class="max-w-xl"
      >
        <template #icon><Icon icon="alert-triangle" /></template>
      </Alert>

      <UpmForm
        v-if="hasForm"
        class="max-w-xl"
        :schema="schema"
        :uischema="uischema"
        :model-value="model"
        :additional-renderers="formRenderers"
        @update:model-value="set($event)"
        @resolve="resolve(model)"
      >
        <template #actions="{ doResolve }">
          <div class="flex flex-col gap-3">
            <Button
              block
              variant="primary"
              :loading="isProcessing"
              :disabled="isLoading"
              :data-attrs="{ 'data-test-key': 'auth-submit' }"
              @click="doResolve"
            >
              {{ t(submitLabel) }}
            </Button>

            <div
              v-if="switches.length"
              class="flex items-center justify-center gap-4"
            >
              <Button
                v-for="entry in switches"
                :key="entry.flow"
                variant="link"
                size="sm"
                :data-attrs="{
                  'data-test-key': 'auth-flow-switch',
                  'data-test-value': entry.flow
                }"
                @click="start(entry.flow)"
              >
                {{ t(entry.label) }}
              </Button>
            </div>

            <!-- 2FA hides every switch link, so the machine's own CANCEL would
                 otherwise have no control at all: the challenge is a dead end
                 for anyone who cannot answer it. -->
            <div v-if="is2faRequired" class="flex items-center justify-center">
              <Button
                variant="link"
                size="sm"
                :data-attrs="{ 'data-test-key': 'auth-cancel' }"
                @click="reject()"
              >
                {{ t("action.back_to_login") }}
              </Button>
            </div>
          </div>
        </template>
      </UpmForm>

      <!-- `idle` and `error` are REACHABLE unauthenticated states with no form
           of their own — the panel would otherwise be empty, with nothing to
           press. The restart links are the same ones the form footer carries. -->
      <div v-if="!hasForm" class="flex flex-col gap-3">
        <Alert
          v-if="hasErrors"
          variant="danger"
          :title="alertTitle"
          :description="errors"
          class="max-w-xl"
        >
          <template #icon><Icon icon="alert-triangle" /></template>
        </Alert>

        <div class="flex items-center justify-center gap-4">
          <Button
            v-for="entry in restarts"
            :key="entry.flow"
            variant="link"
            size="sm"
            :data-attrs="{
              'data-test-key': 'auth-flow-restart',
              'data-test-value': entry.flow
            }"
            @click="start(entry.flow)"
          >
            {{ t(entry.label) }}
          </Button>
        </div>
      </div>
    </template>

    <Alert
      v-if="isAuthenticated"
      appearance="muted"
      variant="success"
      :title="t('labs.auth_authenticated')"
      :data-attrs="{ 'data-test-key': 'auth-authenticated' }"
    >
      <template #icon><Icon icon="check-circle" /></template>
      <template #default>
        <p class="flex items-center gap-2">
          {{ t("labs.auth_authenticated_as") }}
          <Badge v-if="isSelf" size="sm" appearance="muted">
            {{ t(ACTOR_LABEL_KEYS[ScopeActorTypes.SELF]) }}
            <Icon icon="chevron-right" />
          </Badge>
          <Badge v-if="sessionActorLabel" size="sm" appearance="muted">
            {{ t(sessionActorLabel) }}
          </Badge>
        </p>
      </template>
      <template #action>
        <Button
          variant="outline"
          size="sm"
          :data-attrs="{ 'data-test-key': 'auth-logout' }"
          @click="handleLogout()"
        >
          {{ t("action.logout") }}
        </Button>
      </template>
    </Alert>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/auth/AuthJourney
 * @description THE auth surface of this playground — one form at a time, with
 * link-style switching between the flows the scope actually offers
 * (`R6-15`/`R6-15b`). The machine owns which flow is live; the links just send
 * it to another one, so a flow an actor cannot take (staff register/recover)
 * simply never offers its link.
 *
 * Every reachable unauthenticated state draws SOMETHING pressable. `idle` and
 * `error` carry no form, so the links stand on their own as restarts rather
 * than riding the form footer; the 2FA challenge hides every switch, so it
 * carries the machine's own `CANCEL` back to sign-in. A panel with no control
 * is a state the user cannot leave.
 *
 * The overlay used to stand up a second wiring of its own around `UpmAuth`, and
 * that wiring could not do what this one already did: pick the actor, or spawn a
 * session beside a live one. Both are `useAuth`'s own builder channels — `.as()`
 * and `.fresh()` — which a component reaching for the shared instance cannot
 * ask for. So the journey moved here whole and the overlay renders it, rather
 * than the overlay re-implementing it.
 *
 * Everything the surface needs is the scope it is given — the page reads that
 * scope off its url, the overlay off the target the funnel or the session pool
 * built — so this holds the instance and its lifetime, and nothing else. The
 * host decides what a resolved journey MEANS: the page shows who was signed in,
 * the overlay closes over the page it was collected for.
 */

import { Alert, Badge, Button } from "@upmind/ui";
import { computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { formRenderers, Icon, UpmForm } from "@upmind-automation/client-vue";
import {
  AuthFlowTypes,
  ScopeActorTypes,
  useActiveSession,
  useAuth
} from "@upmind-automation/headless";
import { ACTOR_LABEL_KEYS } from "../scope";
import { usePlaygroundSheet } from "../sheets";
import { get, reject as rejectWhere } from "lodash-es";
import type { AuthJourneyProps } from "./AuthJourney.types";

// -----------------------------------------------------------------------------

const props = defineProps<AuthJourneyProps>();

const emit = defineEmits<{
  /** A session was collected — the host decides where that lands. */
  resolve: [];
  /** The signed-in session was ended from the surface itself. */
  logout: [];
}>();

const { t } = useI18n();

// The scope is FIXED for an instance's lifetime: `useAuth()` resolves a keyed
// instance at call time, so a changed actor is a different composable, not a
// reactive read. Hosts key this component on the scope they pass.
//
// Staff actors apply .inBrand(brandId) when a brand is set from the URL (FE-2973).
// Client/Guest builders don't expose .inBrand() — type-gated by design.
const isStaffActor =
  props.actor === ScopeActorTypes.STAFF ||
  (props.actor === ScopeActorTypes.SELF && props.brandId);

const auth = (() => {
  const base = useAuth();

  if (props.fresh) {
    const builder = base.as(
      props.actor as ScopeActorTypes.CLIENT | ScopeActorTypes.STAFF
    );
    if (isStaffActor && props.brandId) {
      return (builder as ReturnType<typeof base.as<ScopeActorTypes.STAFF>>)
        .inBrand(props.brandId)
        .fresh();
    }
    return builder.fresh();
  }

  if (!props.context) {
    const builder = base.as(props.actor);
    if (props.actor === ScopeActorTypes.STAFF && props.brandId) {
      return (
        builder as ReturnType<typeof base.as<ScopeActorTypes.STAFF>>
      ).inBrand(props.brandId);
    }
    return builder;
  }

  const builder = base.as(
    props.actor as ScopeActorTypes.CLIENT | ScopeActorTypes.STAFF
  );
  if (props.actor === ScopeActorTypes.STAFF && props.brandId) {
    return (builder as ReturnType<typeof base.as<ScopeActorTypes.STAFF>>)
      .inBrand(props.brandId)
      .for(props.context.type, props.context.id);
  }
  return builder.for(props.context.type, props.context.id);
})();

const { destroy, isReady, reject, resolve, set, start } = auth.useActions();
const {
  canLogin,
  canRecover,
  canRegister,
  hasErrors,
  is2faRequired,
  isAuthenticated,
  isIdle,
  isLoading,
  isProcessing,
  isValid,
  showLoginForm,
  showRecoverPasswordForm,
  showRegisterForm
} = auth.useMeta();
const {
  scopeActor,
  scopeContext,
  brandId,
  currentState,
  errors,
  model,
  schema,
  scopeMatrix,
  uischema
} = auth.useContext();

const activeSession = useActiveSession();
const { logout } = activeSession.useActions();
const { actor: sessionActor } = activeSession.useContext();

const isSelf = computed(() => props.actor === ScopeActorTypes.SELF);

const sessionActorLabel = computed(() =>
  get(ACTOR_LABEL_KEYS, String(sessionActor.value), "")
);

const hasForm = computed(
  () =>
    showLoginForm.value ||
    showRegisterForm.value ||
    showRecoverPasswordForm.value
);

const submitLabel = computed(() => {
  if (showRegisterForm.value) return "labs.auth_submit_register";
  if (showRecoverPasswordForm.value) return "labs.auth_submit_recover";
  return is2faRequired.value
    ? "labs.auth_submit_2fa"
    : "labs.auth_submit_login";
});

// The staff actions arm only starts login, so its links never appear —
// `canRegister`/`canRecover` alone do not gate the actor (headless gap).
const isStaff = computed(() => scopeActor.value === ScopeActorTypes.STAFF);

/** Every flow this scope can take, in the order the surface offers them. */
const offered = computed(() => {
  const entries: { flow: AuthFlowTypes; label: string }[] = [];

  if (canLogin.value)
    entries.push({
      flow: AuthFlowTypes.LOGIN,
      label: "labs.auth_login_instead"
    });
  if (canRegister.value && !isStaff.value)
    entries.push({
      flow: AuthFlowTypes.REGISTER,
      label: "labs.auth_register_instead"
    });
  if (canRecover.value && !isStaff.value)
    entries.push({
      flow: AuthFlowTypes.RECOVER,
      label: "labs.auth_recover_instead"
    });

  return entries;
});

/** Which flow the surface is drawing right now, if any. */
const liveFlow = computed(() => {
  if (showRegisterForm.value) return AuthFlowTypes.REGISTER;
  if (showRecoverPasswordForm.value) return AuthFlowTypes.RECOVER;
  if (showLoginForm.value) return AuthFlowTypes.LOGIN;
  return undefined;
});

/** Every reachable flow that is not the live one gets its switch link. */
const switches = computed(() => {
  if (is2faRequired.value || isProcessing.value) return [];
  return rejectWhere(offered.value, { flow: liveFlow.value });
});

/**
 * The way OUT of a state with no form. `idle` and `error` are both reachable
 * unauthenticated, and neither draws one — so every offered flow is a restart,
 * not a switch, and there is nothing live to leave out.
 */
const restarts = computed(() => (isProcessing.value ? [] : offered.value));

const alertTitle = computed(() => {
  if (showRegisterForm.value)
    return t("error.session_register_failed") as string;
  if (showRecoverPasswordForm.value)
    return t("error.session_recover_failed") as string;
  // Login is the fallback, not a fourth branch: the formless `error` state has
  // no showX flag left to read, and an untitled Alert draws a bare box.
  return t("error.session_login_failed") as string;
});

function handleLogout() {
  logout();
  destroy();
  emit("logout");
}

watch(isAuthenticated, value => {
  if (value) emit("resolve");
});

// --- Debug sheet registration, keyed by the scope this instance holds, so the
//     modal's own journey never overwrites the page's underneath it.
const { register } = usePlaygroundSheet();

register({
  key: `auth-${props.actor}-${props.context ? `${props.context.type}-${props.context.id}` : "no-context"}-${props.fresh ? "fresh" : "shared"}`,
  factory: () => ({
    name: "Auth",
    state: currentState.value,
    errors: errors.value,
    meta: {
      canLogin: canLogin.value,
      canRecover: canRecover.value,
      canRegister: canRegister.value,
      hasErrors: hasErrors.value,
      is2faRequired: is2faRequired.value,
      isAuthenticated: isAuthenticated.value,
      isIdle: isIdle.value,
      isLoading: isLoading.value,
      isProcessing: isProcessing.value,
      isValid: isValid.value,
      showLoginForm: showLoginForm.value,
      showRecoverPasswordForm: showRecoverPasswordForm.value,
      showRegisterForm: showRegisterForm.value
    },
    scope: {
      actor: scopeActor.value,
      context: scopeContext.value,
      brandId: brandId.value,
      matrix: scopeMatrix
    },
    context: {
      model: model.value,
      schema: schema.value,
      uischema: uischema.value
    }
  })
});

onMounted(async () => {
  await isReady();
  if (isIdle.value) start(AuthFlowTypes.LOGIN);
});

onUnmounted(() => {
  destroy();
});
</script>
