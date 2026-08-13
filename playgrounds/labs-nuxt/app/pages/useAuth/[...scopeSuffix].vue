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

        <AuthJourney
          :actor="actorScope"
          :context="contextScope"
          :fresh="isFreshRequest"
          @logout="router.replace({ name: 'useAuth-logged-out' })"
        />
      </div>
    </div>
  </UpmLayout>
</template>

<script lang="ts" setup>
// --- internal
import { UpmLayout } from "@upmind-automation/client-vue";
import { AUTH_SCOPE_MATRIX } from "@upmind-automation/headless";
import { keys } from "lodash-es";
import type {
  AuthContextTypes,
  ScopeActorTypes
} from "@upmind-automation/headless";
// --- internal (local)
import { AuthJourney } from "~/components/auth";
import {
  useActorScopeSelector,
  useContextScopeSelector
} from "~/components/scope";
import { useActorScope, useContextScope } from "~/composables/scope";
import { isAddSessionRequest } from "~/funnels/labs";

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

// --- Scope from URL
const actorScope = useActorScope();
const contextScope = useContextScope<AuthContextTypes>();

// --- Add-session request: spawn a fresh instance showing the login form even
//     when a session of this scope is already active (never for guest).
const isFreshRequest = isAddSessionRequest(route);

// --- What the chrome offers while this page is on screen. It is the PAGE that
//     declares its composable's scopes, never the journey — the same journey
//     renders inside the auth overlay, over a page with a matrix of its own.
const { register: registerScopes } = useActorScopeSelector();
const { register: registerContexts } = useContextScopeSelector();

onMounted(() => {
  registerScopes(keys(AUTH_SCOPE_MATRIX) as ScopeActorTypes[]);
  registerContexts(AUTH_SCOPE_MATRIX);
});
</script>
