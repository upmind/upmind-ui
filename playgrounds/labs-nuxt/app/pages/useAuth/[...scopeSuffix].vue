<template>
  <Page>
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
          :brand-id="brandId"
          @logout="router.replace({ name: 'useAuth-logged-out' })"
        />
      </div>
    </div>
  </Page>
</template>

<script lang="ts" setup>
// --- internal
import { Page } from "@upmind/ui";
import { computed } from "vue";
import { AUTH_SCOPE_MATRIX } from "@upmind-automation/headless";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { keys } from "lodash-es";
import type { AuthContextTypes } from "@upmind-automation/headless";
// --- internal (local)
import { AuthJourney } from "~/components/auth";
import {
  useActorScopeSelector,
  useContextScopeSelector
} from "~/components/scope";
import {
  useActorScope,
  useBrandScope,
  useContextScope
} from "~/composables/scope";
import { authRequestActor, isAddSessionRequest } from "~/funnels/labs";

// ------------------------------------------------------------------------------

definePageMeta({
  name: "useAuth",
  // Key by fullPath so a query change (the add-session `fresh` nonce) remounts
  // the page — setup re-runs, the old instance destroys, a new .fresh() spawns.
  key: route => route.fullPath,
  nav: {
    label: "useAuth",
    icon: "lock-01"
  }
});

const router = useRouter();
const route = useRoute();

// --- Scope from URL
const actorScope = useActorScope();
const contextScope = useContextScope<AuthContextTypes>();
const brandScope = useBrandScope();
const brandId = computed(() =>
  brandScope.value.mode === "brand" ? brandScope.value.brandId : undefined
);

// --- Add-session request: spawn a fresh instance showing the login form even
//     when a session of this scope is already active. Only when the request is
//     for THIS page's actor — the overlay collects the others — and never for
//     guest, whose fresh instance is a mint, not a form.
const isFreshRequest =
  isAddSessionRequest(route) &&
  authRequestActor(route) === actorScope.value &&
  actorScope.value !== ScopeActorTypes.GUEST;

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
