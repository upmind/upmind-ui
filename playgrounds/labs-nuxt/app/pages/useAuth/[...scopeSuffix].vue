<template>
  <UpmLayout>
    <div class="flex min-h-screen">
      <!-- Main Content Area -->
      <div class="flex-1 space-y-8">
        <!-- Page Header -->
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-display text-3xl font-bold">
              useAuth Composable Playground
            </h1>
            <p class="text-muted mt-2">
              Test the unified auth machine: login, register, recover, and 2FA
              flows.
            </p>
          </div>
        </div>

        <!-- Auth Forms with Tabs (hidden when authenticated) -->
        <Tabs v-if="!isAuthenticated" :tabs="authTabs" v-model="activeTab">
          <!-- Login Tab -->
          <template #content.login>
            <Alert
              v-if="hasErrors && showLoginForm"
              color="danger"
              icon="alert-triangle"
              :title="alertTitle"
              :description="errors"
              class="max-w-xl"
            />

            <UpmForm
              class="max-w-xl pt-6"
              v-if="showLoginForm"
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
                  @click="doResolve"
                >
                  {{ is2faRequired ? "Verify 2FA" : "Sign In" }}
                </Button>
              </template>
            </UpmForm>
          </template>

          <!-- Register Tab -->
          <template #content.register>
            <Alert
              v-if="hasErrors && showRegisterForm"
              color="danger"
              icon="alert-triangle"
              :title="alertTitle"
              :description="errors"
              class="max-w-xl"
            />

            <UpmForm
              class="max-w-xl pt-6"
              v-if="showRegisterForm"
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
                  @click="doResolve"
                >
                  Create Account
                </Button>
              </template>
            </UpmForm>
          </template>

          <!-- Recover Tab -->
          <template #content.recover>
            <Alert
              v-if="hasErrors && showRecoverPasswordForm"
              color="danger"
              icon="alert-triangle"
              :title="alertTitle"
              :description="errors"
              class="max-w-xl"
            />

            <UpmForm
              class="max-w-xl pt-6"
              v-if="showRecoverPasswordForm"
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
                  @click="doResolve"
                >
                  Send Recovery Email
                </Button>
              </template>
            </UpmForm>
          </template>
        </Tabs>

        <!-- Authenticated State -->
        <Alert
          v-if="isAuthenticated"
          variant="minimal"
          color="success"
          icon="check-circle"
          title="Authenticated"
        >
          <template #default>
            <p class="flex items-center gap-2">
              Successfully authenticated as
              <Badge
                v-if="isSelf"
                size="sm"
                variant="minimal"
                append-icon="chevron-right"
              >
                {{ getScopeLabel(ScopeActorTypes.SELF) }}
              </Badge>
              <Badge size="sm" variant="minimal">
                {{ getScopeLabel(sessionActor) }}
              </Badge>
            </p>
          </template>
          <template #action>
            <Button variant="outline" size="sm" @click="handleLogout()">
              Logout
            </Button>
          </template>
        </Alert>
      </div>
    </div>
  </UpmLayout>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
// --- internal
import {
  formRenderers,
  UpmForm,
  UpmLayout
} from "@upmind-automation/client-vue";
import {
  AuthFlowTypes,
  ScopeActorTypes,
  useAuth,
  useActiveSession
} from "@upmind-automation/headless";
import { Alert, Badge, Button, Tabs } from "@upmind-automation/upmind-ui";
// --- internal (local)
import type { AuthContextTypes } from "@upmind-automation/headless";
import type { TabItem } from "@upmind-automation/upmind-ui";
import { useInspector } from "~/components/inspector";
import {
  useActorScopeSelector,
  useContextScopeSelector
} from "~/components/scope";
import { useActorScope, useContextScope } from "~/composables/scope";

// ------------------------------------------------------------------------------

definePageMeta({
  name: "useAuth",
  // Key by fullPath so a query change (the add-session `fresh` nonce) remounts
  // the page — setup re-runs, the old instance destroys, a new .fresh() spawns.
  key: route => route.fullPath,
  nav: {
    label: "useAuth",
    icon: "lock-01",
    section: "Composables",
    order: 1
  }
});

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

// --- Scope from URL
const actorScope = useActorScope();
const contextScope = useContextScope<AuthContextTypes>();

// --- Add-session request: spawn a fresh instance showing the login form even
//     when a session of this scope is already active (never for guest).
//     Presence check — the value is a remount nonce, not a boolean.
const isFreshRequest = !!route.query.fresh;

// --- Actor Scope Selector
const {
  getScopeLabel,
  isSelf,
  register: registerScopes
} = useActorScopeSelector();

// --- Context Scope Selector
const { register: registerContexts } = useContextScopeSelector();

// --- Auth composable (scoped to URL actor scope and optionally context scope if present)
const auth = isFreshRequest
  ? useAuth()
      .as(actorScope.value as ScopeActorTypes.CLIENT | ScopeActorTypes.STAFF)
      .fresh()
  : !contextScope.value
    ? useAuth().as(actorScope.value)
    : useAuth()
        .as(actorScope.value as ScopeActorTypes.CLIENT | ScopeActorTypes.STAFF)
        .for(contextScope.value.type, contextScope.value.id);

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
  availableActors,
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

// --- Session information for authenticated actor (if any)
const activeSession = useActiveSession();
const { logout } = activeSession.useActions();

const { actor: sessionActor } = activeSession.useContext();

// --- Tab configuration
const authTabs = computed<TabItem[]>(() => {
  const tabs: TabItem[] = [];

  if (canLogin.value) {
    tabs.push({ label: "Login", value: "login", icon: "log-in-01" });
  }
  if (canRegister.value) {
    tabs.push({ label: "Register", value: "register", icon: "user-plus-01" });
  }
  if (canRecover.value) {
    tabs.push({ label: "Recover", value: "recover", icon: "key-01" });
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

/**
 * Handle logout - logs out session, destroys auth instance, navigates to logged-out route.
 */
function handleLogout() {
  logout();
  destroy();
  router.replace({ name: "useAuth-logged-out" });
}

// --- Inspector debug registration
const { register } = useInspector();

register({
  key: `useAuth-auth-${actorScope.value}-${contextScope.value ? `${contextScope.value.type}-${contextScope.value.id}` : "no-context"}`,
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

// --- Lifecycle
onMounted(async () => {
  registerScopes(availableActors.value);
  registerContexts(scopeMatrix);
  await isReady();
  if (isIdle.value) {
    start(AuthFlowTypes.LOGIN);
  }
});

onUnmounted(() => {
  destroy();
});
</script>
