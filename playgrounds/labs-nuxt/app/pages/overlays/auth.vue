<template>
  <div class="flex flex-col gap-4">
    <!-- A real dialog header, so the container's absolute close button lands in
         this row and never over the choices below it. -->
    <DialogHeader>
      <DialogTitle>{{ t("labs.auth_gate_title") }}</DialogTitle>
    </DialogHeader>

    <template v-if="isGate && !hasChoice">
      <div
        v-for="group in sessionGroups"
        :key="group.label"
        class="flex flex-col gap-1"
      >
        <p class="text-muted text-xs tracking-wider uppercase">
          {{ t(group.label) }}
        </p>

        <button
          v-for="node in group.nodes"
          :key="node.id"
          type="button"
          class="hover:bg-button-ghost-hover flex w-full items-center rounded-xs text-left"
          :class="sessionItem({ isActive: node.isActive })"
          data-test-key="session-switch"
          :data-test-value="node.id"
          @click="switchInto(node)"
        >
          <Avatar
            size="sm"
            :src="node.avatar?.src"
            :alt="node.avatar?.caption"
            :force-caption="node.avatar?.forceCaption"
          >
            <template #fallback>{{ node.avatar?.caption }}</template>
          </Avatar>
          <span class="flex min-w-0 flex-col">
            <span class="truncate text-sm font-medium">{{ node.label }}</span>
            <span v-if="node.sublabel" class="text-muted truncate text-xs">
              {{ t(node.sublabel) }}
            </span>
          </span>
          <Icon
            v-if="node.isActive"
            icon="check"
            size="nano"
            class="text-success ml-auto"
          />
        </button>
      </div>

      <div class="flex flex-col gap-1" data-test-key="actor-scope-add-account">
        <template v-for="entry in addChoices" :key="entry.value">
          <!-- Guest Customer is an ACTION, fired on its own row: the list stays
               up, the row shows the working state, and the dialog closes when the
               session lands (`registerAsGuest`). -->
          <template v-if="entry.value === AUTH_GATE_GUEST_CUSTOMER">
            <Button
              variant="ghost"
              size="sm"
              block
              class="justify-start"
              :loading="isRegisteringAsGuest"
              :disabled="!canRegisterAsGuest || isRegisteringAsGuest"
              :data-attrs="{ 'data-test-key': entry.testKey }"
              @click="registerGuestCustomer()"
            >
              <Icon :icon="entry.icon" size="xs" />
              {{
                isRegisteringAsGuest
                  ? t("labs.auth_guest_customer_running")
                  : t(entry.label)
              }}
            </Button>
            <p
              v-if="!canRegisterAsGuest"
              class="text-muted px-2 text-xs"
              data-test-key="auth-guest-customer-disabled"
            >
              {{ t("labs.auth_guest_customer_disabled") }}
            </p>
            <p
              v-else-if="guestCustomerFailed"
              class="text-danger px-2 text-xs"
              data-test-key="auth-guest-customer-error"
            >
              {{ guestCustomerErrors }}
            </p>
          </template>

          <Button
            v-else
            variant="ghost"
            size="sm"
            block
            class="justify-start"
            :data-attrs="{ 'data-test-key': entry.testKey }"
            @click="choose(entry.value)"
          >
            <Icon :icon="entry.icon" size="xs" />
            {{ t(entry.label) }}
          </Button>
        </template>
      </div>
    </template>

    <AuthJourney
      v-if="journeyActor"
      :key="journey"
      :actor="journeyActor"
      :fresh="isAddSession"
      :cancellable="isGate"
      @cancel="back()"
      @logout="emit('close')"
      @resolve="handoff()"
    />
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module pages/overlays/auth
 * @description The auth-collect OVERLAY — the session form a guarded route opens
 * over itself. `registerOverlayRoutes` injects it as `<parent>--session`, and
 * the shared `OverlayController` renders it in the modal over the page beneath;
 * on success it emits close and the controller returns to the parent, where the
 * composable re-reads the now-authenticated session.
 *
 * The GATE renders the app's own actor picker, not a picker of its own: the same
 * `useActorScopeSelector` vocabulary the header `SessionSwitcher` drives —
 * grouped held sessions the user can switch into, and the `actor-scope-add-*`
 * ways in beneath them (`R7-1`).
 *
 * The ways in split by shape. Client and Staff REPLACE the list with
 * `AuthJourney` for the chosen actor, whose action row carries the back control
 * to the list; Guest routes out to the page beneath. Guest Customer is an ACTION,
 * not a form: it fires in place from its own row through a FRESH client instance
 * — isolated from the `AuthJourney` client instance, which is stopped when its
 * form unmounts — and the row itself carries the working state and any failure
 * reason, closing the overlay only when the session lands.
 *
 * An arrival that already names an actor (its query, else the url scope) brings
 * its own journey and shows no gate; the ADD-SESSION marker asks that journey
 * for a session beside the live ones (`H5`, `AC7.1`/`AC7.2`).
 */

import { Avatar, Button, DialogHeader, DialogTitle } from "@upmind/ui";
import { computed, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@upmind-automation/foundation";
import { OverlayType } from "@upmind-automation/headless";
import {
  ScopeActorTypes,
  useActiveSession,
  useAuth
} from "@upmind-automation/headless";
import { get, isEmpty, reject } from "lodash-es";
import type { AuthGateChoice } from "~/components/auth";
import type { SessionItem } from "~/components/scope";
import { AuthJourney, AUTH_GATE_GUEST_CUSTOMER } from "~/components/auth";
import { useActorScopeSelector } from "~/components/scope";
import { sessionItem } from "~/components/scope/SessionSwitcher.styles";
import { useActorScope } from "~/composables/scope";
import {
  authNamedActor,
  authRequestActor,
  isAddSessionRequest,
  scopedPageTarget
} from "~/funnels/labs";
import { ADD_SESSION_PARAM } from "~/funnels/labs.constants";
import { ROUTE } from "~/funnels/types";

const emit = defineEmits<{
  close: [];
}>();

// -----------------------------------------------------------------------------

/**
 * `dismissable` is DECLARED, not inherited (`R7-12`): `OverlayController` casts
 * an absent Boolean to `false`, hard-refusing the close control. This is the one
 * overlay that must close, so it says so on its own route.
 */
definePageMeta({
  name: ROUTE.OVERLAY_AUTH,
  overlay: OverlayType.MODAL,
  dismissable: true
});

const route = useRoute();
const router = useRouter();

const { t } = useI18n();

/** The url's own scope, for an overlay reached without a target behind it. */
const scope = useActorScope();

const isAddSession = computed(() => isAddSessionRequest(route));

/** The actor the ENTRY named — its own query, else the url's scope segment. */
const named = computed(() =>
  authNamedActor(authRequestActor(route) ?? scope.value)
);

/** The actor taken at the gate, which nothing but this arrival carries. */
const choice = ref<AuthGateChoice>();

/**
 * The actor whose JOURNEY renders. A named arrival brings its own; at the gate
 * only Client and Staff run a journey — Guest routes out and Guest Customer is an
 * in-place action, so neither resolves to a journey actor.
 */
const journeyActor = computed<ScopeActorTypes | undefined>(() => {
  if (named.value) return named.value;
  return choice.value === ScopeActorTypes.CLIENT ||
    choice.value === ScopeActorTypes.STAFF
    ? choice.value
    : undefined;
});

const isGate = computed(() => !named.value);

/** A gate choice is being collected — its form replaces the chooser. */
const hasChoice = computed(() => choice.value !== undefined);

const {
  directClientItems,
  getAddSessionIcon,
  getAddSessionLabel,
  getAddSessionTestKey,
  guestItems,
  staffSessionNodes,
  switchSession
} = useActorScopeSelector();

// A FRESH client instance for the guest-customer action, isolated from the
// Client journey's own instance (which is stopped when its form unmounts).
const guestCustomer = useAuth().as(ScopeActorTypes.CLIENT).fresh();
const guestCustomerActions = guestCustomer.useActions();
const {
  canRegisterAsGuest,
  isRegisteringAsGuest,
  hasErrors: guestCustomerFailed
} = guestCustomer.useMeta();
const { errors: guestCustomerErrors } = guestCustomer.useContext();

/** The held sessions, grouped exactly as the header pool groups them. */
const sessionGroups = computed(() =>
  reject(
    [
      { label: "labs.session_staff", nodes: staffSessionNodes.value },
      { label: "labs.session_clients", nodes: directClientItems.value },
      { label: "labs.session_guests", nodes: guestItems.value }
    ],
    group => isEmpty(group.nodes)
  )
);

/**
 * The ways in — the pool's own `actor-scope-add-*` controls, plus Guest Customer
 * which the pool never offered.
 */
const addChoices = computed(
  () =>
    [
      {
        value: ScopeActorTypes.GUEST,
        testKey: getAddSessionTestKey(ScopeActorTypes.GUEST),
        icon: getAddSessionIcon(ScopeActorTypes.GUEST),
        label: getAddSessionLabel(ScopeActorTypes.GUEST)
      },
      {
        value: AUTH_GATE_GUEST_CUSTOMER,
        testKey: "actor-scope-add-guest-customer",
        icon: "user-plus-01",
        label: "labs.auth_add_guest_customer"
      },
      {
        value: ScopeActorTypes.CLIENT,
        testKey: getAddSessionTestKey(ScopeActorTypes.CLIENT),
        icon: getAddSessionIcon(ScopeActorTypes.CLIENT),
        label: getAddSessionLabel(ScopeActorTypes.CLIENT)
      },
      {
        value: ScopeActorTypes.STAFF,
        testKey: getAddSessionTestKey(ScopeActorTypes.STAFF),
        icon: getAddSessionIcon(ScopeActorTypes.STAFF),
        label: getAddSessionLabel(ScopeActorTypes.STAFF)
      }
    ] satisfies {
      value: AuthGateChoice;
      testKey: string;
      icon: string;
      label: string;
    }[]
);

const journey = computed(
  () => `${journeyActor.value}:${get(route.query, ADD_SESSION_PARAM, "")}`
);

const { whenAuthenticated } = useActiveSession().useActions();

/**
 * Handle the scope choice. Client and Staff replace the chooser with their form;
 * Guest collects no session, so taking it leaves the overlay for the page
 * beneath.
 */
function choose(next: AuthGateChoice): void {
  if (next === ScopeActorTypes.GUEST) {
    continueAsGuest();
    return;
  }

  choice.value = next;
}

/** Return from a chosen form to the chooser. */
function back(): void {
  choice.value = undefined;
}

/**
 * Mint a guest-customer client session from the list, in place. The row shows
 * the working state and, on failure, the reason; the overlay closes only once
 * the session lands.
 */
async function registerGuestCustomer(): Promise<void> {
  if (!canRegisterAsGuest.value || isRegisteringAsGuest.value) return;

  await guestCustomerActions.isReady();
  if (
    "registerAsGuest" in guestCustomerActions &&
    (await guestCustomerActions.registerAsGuest())
  )
    await handoff();
}

/**
 * Guest is a SCOPE, not a session — nothing for `useAuth` to collect and
 * `guardScenario` admits a url that names it — so it leaves the overlay for the
 * page beneath, re-scoped (`R7-1`).
 */
function continueAsGuest(): void {
  void router.push(scopedPageTarget(route, ScopeActorTypes.GUEST));
}

/** Switch into a held session, the same write the header pool's rows make. */
async function switchInto(node: SessionItem): Promise<void> {
  await switchSession(node.actor, node.id);
  await handoff();
}

/**
 * The journey resolves the instant its own machine holds the token, but the
 * guard that sent us here reads the ACTIVE session, which the store promotes a
 * beat later. Closing on the earlier signal strands the url on `/auth/`
 * (`R6-2b`), so the hand-off waits for the signal the guard itself reads.
 */
async function handoff(): Promise<void> {
  await whenAuthenticated().catch(() => undefined);
  emit("close");
}

onUnmounted(() => {
  guestCustomerActions.destroy();
});
</script>
