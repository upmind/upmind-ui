<template>
  <div class="flex flex-col gap-4">
    <ToggleGroup
      v-if="isGate"
      type="single"
      :model-value="choice"
      class="grid w-full grid-cols-3"
      @update:model-value="choose($event as AuthGateChoice)"
    >
      <ToggleGroupItem
        v-for="entry in choices"
        :key="entry.value"
        :value="entry.value"
        :data-attrs="entry.dataAttrs"
      >
        {{ entry.label }}
      </ToggleGroupItem>
    </ToggleGroup>

    <AuthJourney
      v-if="actor"
      :key="journey"
      :actor="actor"
      :fresh="isAddSession"
      @logout="emit('close')"
      @resolve="handoff()"
    />

    <!-- Guest signs into nothing, so it is a SCOPE change and not a journey —
         it leaves the overlay for the page beneath, re-scoped. R9's chooser is
         the three journeys; this is the fourth way in, and it is a route-out. -->
    <Button
      v-if="isGate"
      variant="link"
      size="sm"
      class="self-center"
      :data-attrs="{
        'data-test-key': 'auth-actor',
        'data-test-value': ScopeActorTypes.GUEST
      }"
      @click="continueAsGuest()"
    >
      {{ t("labs.session_guest") }}
    </Button>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module pages/overlays/auth
 * @description The auth-collect OVERLAY — the session form a guarded route
 * opens over itself, rather than sitting on skeletons that never settle (`D2`).
 *
 * It is the cart's `AuthOverlay` in this playground: the route carries the
 * overlay meta, `registerOverlayRoutes` injects it as `<parent>--session` onto
 * every eligible page, and the shared `OverlayController` renders it in the
 * modal container over whatever page is underneath. On success it emits close,
 * and the controller navigates back to the parent route — where the composable
 * this playground boots re-reads the now-authenticated session by itself.
 *
 * The journey is the `useAuth` page's own, rendered here (`R6-15`/`R6-15b`).
 * That page already collects a session for any actor and already adds one
 * beside a live session, so this presents it instead of rebuilding it: the two
 * things a second wiring could not reach — `useAuth`'s `.as()` and `.fresh()`
 * builder channels — are exactly what the two entrances need, and both arrive
 * as props.
 *
 * Two entries, ONE overlay (`H5`, `AC7.1`/`AC7.2`). The funnel states the split
 * in the target it builds and this reads it rather than restating it: the
 * ADD-SESSION marker asks the journey for a session BESIDE the live ones, and
 * the actor comes with it, since the pool's own control already named which
 * kind. No marker is the guard's own rejection, at the actor it rejected on.
 *
 * The key is that pair. `OverlayController` mounts one component per overlay
 * route, so a second add-session — a new nonce on the same route — would
 * otherwise reuse the instance that already holds a scope, and `useAuth`
 * resolves its instance once, at call time.
 *
 * The GATE also CHOOSES that actor (`R7-1`). Add-session is taken from a control
 * that already says which kind, so it arrives named; an arrival at a guarded
 * page names one only when the url does. Nothing named is nobody chosen — so the
 * gate offers the three journeys (`R9`: Client │ Staff │ Impersonate) and
 * collects nothing until one is taken, rather than locking a staff visitor into
 * the client journey the page happens to declare.
 *
 * Guest sits BESIDE the group, not in it: it collects no session at all, so it
 * is a scope change on the page underneath rather than a fourth journey — which
 * is why R9's chooser names three and the way in numbers four.
 */

import { Button, ToggleGroup, ToggleGroupItem } from "@upmind/ui";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { OverlayType } from "@upmind-automation/client-vue";
import { ScopeActorTypes, useActiveSession } from "@upmind-automation/headless";
import { get } from "lodash-es";
import type { AuthGateChoice } from "~/components/auth";
import { AuthJourney, AUTH_GATE_IMPERSONATE } from "~/components/auth";
import { ACTOR_LABEL_KEYS } from "~/components/scope";
import { useActorScope } from "~/composables/scope";
import {
  authNamedActor,
  authRequestActor,
  isAddSessionRequest,
  scopedPageTarget
} from "~/funnels/labs";
import { ADD_SESSION_PARAM } from "~/funnels/labs.constants";
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

/**
 * `dismissable` is DECLARED, not inherited (`R7-12`). `OverlayController` merges
 * an overlay's own meta over its props, and its `dismissable` prop is a Boolean
 * absent from its `withDefaults` — which Vue casts to `false` when nobody passes
 * it, so every overlay it renders arrives at the dialog hard-refused: no close
 * control drawn, ESC and the backdrop both prevented. This is the one overlay
 * that must close, so it says so on its own route.
 */
definePageMeta({
  name: ROUTE.OVERLAY_AUTH,
  overlay: OverlayType.MODAL,
  dismissable: true
});

const route = useRoute();
const router = useRouter();

const { t } = useI18n();

const emit = defineEmits<{
  close: [];
}>();

/** The url's own scope, for an overlay reached without a target behind it. */
const scope = useActorScope();

const isAddSession = computed(() => isAddSessionRequest(route));

/** The actor the ENTRY named — its own query, else the url's scope segment. */
const named = computed(() =>
  authNamedActor(authRequestActor(route) ?? scope.value)
);

/**
 * The one taken at the gate, which nothing but this arrival carries. It opens on
 * CLIENT rather than on nobody: an unnamed arrival is overwhelmingly a client
 * signing in, and a gate collecting nothing until it is pressed presents an
 * empty box where the form belongs. The group stays above it either way, so
 * staff and guest remain one press from the surface, not two.
 *
 * It holds the CHOICE, never the actor it resolves to: Impersonate and Staff
 * run the same journey, so a group bound to the actor draws Staff pressed when
 * Impersonate was taken, and Impersonate can never read as chosen at all.
 */
const choice = ref<AuthGateChoice>(ScopeActorTypes.CLIENT);

/** Impersonate IS the staff journey; the client is picked after staff login. */
const picked = computed<ScopeActorTypes>(() =>
  choice.value === AUTH_GATE_IMPERSONATE ? ScopeActorTypes.STAFF : choice.value
);

const actor = computed(() => named.value ?? picked.value);

/**
 * The chooser stays up once answered rather than collapsing into the journey:
 * the wrong pick is one press away from the right one, and the group's own
 * pressed state is what says which is being collected.
 */
const isGate = computed(() => !named.value);

const choices = computed(() => [
  {
    value: ScopeActorTypes.CLIENT,
    label: t(ACTOR_LABEL_KEYS[ScopeActorTypes.CLIENT]),
    dataAttrs: {
      "data-test-key": "auth-actor",
      "data-test-value": ScopeActorTypes.CLIENT
    }
  },
  {
    value: ScopeActorTypes.STAFF,
    label: t(ACTOR_LABEL_KEYS[ScopeActorTypes.STAFF]),
    dataAttrs: {
      "data-test-key": "auth-actor",
      "data-test-value": ScopeActorTypes.STAFF
    }
  },
  {
    value: AUTH_GATE_IMPERSONATE,
    label: t("labs.auth_scope_impersonate"),
    dataAttrs: {
      "data-test-key": "auth-actor",
      "data-test-value": AUTH_GATE_IMPERSONATE
    }
  }
]);

const journey = computed(
  () => `${actor.value}:${get(route.query, ADD_SESSION_PARAM, "")}`
);

const { whenAuthenticated } = useActiveSession().useActions();

/**
 * Handle the scope choice. Client and Staff start their respective auth
 * journeys. Impersonate starts the Staff journey; the client to impersonate is
 * selected from SessionSwitcher after staff login.
 */
function choose(next: AuthGateChoice): void {
  // The group re-emits as it mounts, and an empty emit is not a choice: taking
  // it would clear the pick the gate opens on and leave three blank tiles over
  // the space the form belongs in.
  if (!next) return;

  choice.value = next;
}

/**
 * Guest is a SCOPE, not a session — there is nothing for `useAuth` to collect
 * and `guardScenario` admits a url that names it — so it leaves the overlay for
 * the page beneath, re-scoped (`R7-1`).
 */
function continueAsGuest(): void {
  void router.push(scopedPageTarget(route, ScopeActorTypes.GUEST));
}

/**
 * The journey resolves the instant its OWN machine holds the token, but the
 * guard that sent us here reads the ACTIVE session, which the store promotes a
 * beat later. Closing on the earlier signal hands the page back to a guard that
 * still sees a guest: it re-targets this very overlay, vue-router discards that
 * as a redundant navigation, and the close never lands — the overlay is gone
 * and the url is stranded on `/auth/` forever (`R6-2b`). So the hand-off waits
 * for the signal the guard itself reads.
 */
async function handoff(): Promise<void> {
  await whenAuthenticated().catch(() => undefined);
  emit("close");
}
</script>
