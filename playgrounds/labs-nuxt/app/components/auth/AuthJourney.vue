<template>
  <div :class="styles.authJourney.root">
    <Tabs v-if="!isAuthenticated" v-model="activeTab" :tabs="authTabs">
      <template #[`content.login`]>
        <Alert
          v-if="hasErrors && showLoginForm"
          color="danger"
          icon="alert-triangle"
          :title="alertTitle"
          :description="errors"
          :class="styles.authJourney.alert"
        />

        <UpmForm
          v-if="showLoginForm"
          :class="styles.authJourney.form"
          :schema="schema"
          :uischema="uischema"
          :model-value="model"
          :additional-renderers="formRenderers"
          @update:model-value="set($event)"
          @resolve="resolve(model)"
        >
          <template #actions="{ doResolve }">
            <Button
              class="w-full"
              color="primary"
              :loading="isProcessing"
              :disabled="isLoading"
              :label="t(loginLabel)"
              :data-attrs="{ 'data-test-key': 'auth-submit' }"
              @click="doResolve"
            />
          </template>
        </UpmForm>
      </template>

      <template #[`content.register`]>
        <Alert
          v-if="hasErrors && showRegisterForm"
          color="danger"
          icon="alert-triangle"
          :title="alertTitle"
          :description="errors"
          :class="styles.authJourney.alert"
        />

        <UpmForm
          v-if="showRegisterForm"
          :class="styles.authJourney.form"
          :schema="schema"
          :uischema="uischema"
          :model-value="model"
          :additional-renderers="formRenderers"
          @update:model-value="set($event)"
          @resolve="resolve(model)"
        >
          <template #actions="{ doResolve }">
            <Button
              class="w-full"
              color="primary"
              :loading="isProcessing"
              :disabled="isLoading"
              :label="t('labs.auth_submit_register')"
              :data-attrs="{ 'data-test-key': 'auth-submit' }"
              @click="doResolve"
            />
          </template>
        </UpmForm>
      </template>

      <template #[`content.recover`]>
        <Alert
          v-if="hasErrors && showRecoverPasswordForm"
          color="danger"
          icon="alert-triangle"
          :title="alertTitle"
          :description="errors"
          :class="styles.authJourney.alert"
        />

        <UpmForm
          v-if="showRecoverPasswordForm"
          :class="styles.authJourney.form"
          :schema="schema"
          :uischema="uischema"
          :model-value="model"
          :additional-renderers="formRenderers"
          @update:model-value="set($event)"
          @resolve="resolve(model)"
        >
          <template #actions="{ doResolve }">
            <Button
              class="w-full"
              color="primary"
              :loading="isProcessing"
              :disabled="isLoading"
              :label="t('labs.auth_submit_recover')"
              :data-attrs="{ 'data-test-key': 'auth-submit' }"
              @click="doResolve"
            />
          </template>
        </UpmForm>
      </template>
    </Tabs>

    <Alert
      v-if="isAuthenticated"
      variant="minimal"
      color="success"
      icon="check-circle"
      :title="t('labs.auth_authenticated')"
      :data-attrs="{ 'data-test-key': 'auth-authenticated' }"
    >
      <template #default>
        <p :class="styles.authJourney.identity">
          {{ t("labs.auth_authenticated_as") }}
          <Badge
            v-if="isSelf"
            size="sm"
            variant="minimal"
            append-icon="chevron-right"
          >
            {{ t(ACTOR_LABEL_KEYS[ScopeActorTypes.SELF]) }}
          </Badge>
          <Badge v-if="sessionActorLabel" size="sm" variant="minimal">
            {{ t(sessionActorLabel) }}
          </Badge>
        </p>
      </template>
      <template #action>
        <Button
          variant="outline"
          size="sm"
          :label="t('action.logout')"
          :data-attrs="{ 'data-test-key': 'auth-logout' }"
          @click="handleLogout()"
        />
      </template>
    </Alert>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module components/auth/AuthJourney
 * @description THE auth surface of this playground — the Login/Register/Recover
 * tab set the `useAuth` page has always rendered, lifted out of it so the auth
 * OVERLAY renders the very same thing (`R6-15`/`R6-15b`).
 *
 * The overlay used to stand up a second wiring of its own around `UpmAuth`, and
 * that wiring could not do what this one already did: pick the actor, or spawn a
 * session beside a live one. Both are `useAuth`'s own builder channels — `.as()`
 * and `.fresh()` — which a component reaching for the shared instance cannot
 * ask for. So the journey moved here whole and the overlay renders it, rather
 * than the overlay re-implementing it: the staff arm comes free with the actor
 * prop, and the add-session arm free with `fresh`.
 *
 * Everything the surface needs is the scope it is given — the page reads that
 * scope off its url, the overlay off the target the funnel or the session pool
 * built — so this holds the instance and its lifetime, and nothing else. The
 * host decides what a resolved journey MEANS: the page shows who was signed in,
 * the overlay closes over the page it was collected for.
 */

import { computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { formRenderers, UpmForm } from "@upmind-automation/client-vue";
import {
  AuthFlowTypes,
  ScopeActorTypes,
  useActiveSession,
  useAuth
} from "@upmind-automation/headless";
import {
  Alert,
  Badge,
  Button,
  Tabs,
  useStyles
} from "@upmind-automation/upmind-ui";
import { ACTOR_LABEL_KEYS } from "../scope";
import { usePlaygroundSheet } from "../sheets";
import config from "./AuthJourney.styles";
import { get } from "lodash-es";
import type { AuthJourneyProps } from "./AuthJourney.types";
import type { TabItem } from "@upmind-automation/upmind-ui";

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
const auth = props.fresh
  ? useAuth()
      .as(props.actor as ScopeActorTypes.CLIENT | ScopeActorTypes.STAFF)
      .fresh()
  : !props.context
    ? useAuth().as(props.actor)
    : useAuth()
        .as(props.actor as ScopeActorTypes.CLIENT | ScopeActorTypes.STAFF)
        .for(props.context.type, props.context.id);

const { destroy, isReady, resolve, set, start } = auth.useActions();
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

const loginLabel = computed(() =>
  is2faRequired.value ? "labs.auth_submit_2fa" : "labs.auth_submit_login"
);

const authTabs = computed<TabItem[]>(() => {
  const tabs: TabItem[] = [];

  if (canLogin.value) {
    tabs.push({
      label: t("labs.auth_tab_login"),
      value: "login",
      icon: "log-in-01"
    });
  }
  if (canRegister.value) {
    tabs.push({
      label: t("labs.auth_tab_register"),
      value: "register",
      icon: "user-plus-01"
    });
  }
  if (canRecover.value) {
    tabs.push({
      label: t("labs.auth_tab_recover"),
      value: "recover",
      icon: "key-01"
    });
  }

  return tabs;
});

const activeTab = computed({
  get: () => {
    if (showLoginForm.value) return "login";
    if (showRegisterForm.value) return "register";
    if (showRecoverPasswordForm.value) return "recover";
    return authTabs.value[0]?.value ?? "login";
  },
  set: (value: string) => {
    if (value === "login") start(AuthFlowTypes.LOGIN);
    else if (value === "register") start(AuthFlowTypes.REGISTER);
    else if (value === "recover") start(AuthFlowTypes.RECOVER);
  }
});

const alertTitle = computed(() => {
  if (showRegisterForm.value) return t("form.register.error") as string;
  if (showRecoverPasswordForm.value) return t("form.recover.error") as string;
  if (showLoginForm.value) return t("form.login.error") as string;
  return "";
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

const styles = useStyles(["authJourney"], {}, config);
</script>
