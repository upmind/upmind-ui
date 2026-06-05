// --- external

// --- internal
import { useSession } from "./";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { State, Subscription } from "xstate";
import { getTokenFromStorage } from "./utils";
import { stateMatches } from "../../utils";
import { Contexts } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
// We have a valid AUTH session when we are logged in as a client (TODO: admin + actor)
// this will fire every time we transition to a new state
const authCallback = (
  state: State<any, any, any, any, any>,
  hasSession: boolean,
  callback: any
) => {
  // Valid session
  const clientMachine = state?.children?.clientMachine;
  const guestMachine = state?.children?.guestMachine;
  const currentMachine =
    state?.children?.clientMachine || state?.children?.guestMachine;

  // If session expired, unauthenticate immediately
  if (stateMatches(state, ["expired"])) {
    callback({ type: "UNAUTHENTICATED" });
    return false;
  }

  // If we have an error and we have a session, unauthenticate
  if (stateMatches(state, ["checking", "error"])) {
    if (hasSession) {
      callback({ type: "UNAUTHENTICATED" });
    }
    return false;
  }

  // If  we were logged in, ie a client, but now complete or done, unauthenticate
  if (
    state.matches(Contexts.CLIENT) &&
    stateMatches(currentMachine, ["complete", "done"])
  ) {
    if (hasSession) {
      callback({ type: "UNAUTHENTICATED" });
    }
    return false;
  }

  // Session-bearing states. A client keeps its session through `unverified`
  // (authenticated — just required to verify their email before checkout) and
  // through `loading` (a transient REFRESH, not a logout) so consumers (basket,
  // payment) don't churn UNAUTHENTICATED → SESSION on every reload. A guest only
  // holds a session in `available` (guest `loading` is treated as unauthenticated).
  const sessionStates = state.matches(Contexts.CLIENT)
    ? ["available", "unverified", "loading"]
    : ["available"];

  // We have a session IF we have an access token regardless of being in guest
  // or client mode. Only (re)establish + announce SESSION when we don't already
  // hold one — keeping `hasSession` stable once set stops the status flip-flop
  // that re-announced SESSION on every transition.
  if (stateMatches(currentMachine, sessionStates)) {
    if (!hasSession) {
      hasSession = !isEmpty(getTokenFromStorage());
      if (hasSession) callback({ type: "SESSION" });
    }
  } else {
    return false;
  }

  // Authenticated if the client is in a session-bearing state — `available`,
  // `unverified` (must verify email), or a transient `loading` (refresh).
  // > indicates we are logged in and have a valid access token
  //
  // NOTE: this deliberately covers a *guest client* (`is_guest: true`) too — a
  // guest client lives in the client machine, so it is "authenticated" here in
  // the same way a full client is. The guest-vs-full distinction is an identity
  // detail (read `isGuestClient` from `useSession`), not an auth-status concern.
  // A plain guest (guest machine) only ever gets `SESSION`, never this.
  if (
    hasSession &&
    state.matches(Contexts.CLIENT) &&
    stateMatches(clientMachine, sessionStates)
  ) {
    callback({ type: "AUTHENTICATED" });
  }

  // Unauthenticated if guest loading
  // > indicates we are not logged in and are generating a guest token
  else if (
    hasSession &&
    state.matches(Contexts.GUEST) &&
    stateMatches(guestMachine, "loading")
  ) {
    hasSession = false;
    callback({ type: "UNAUTHENTICATED" });
  }

  return hasSession;
};

export const authSubscription = async (callback: any, onReceive: any) => {
  const { subscribe } = useSession();
  // firstly, send service's current state upon subscription
  let hasSession = false;

  // Edge-trigger: authCallback is level-triggered (it runs on every transition),
  // so forward a status event only when it actually changes. Without this it
  // re-emits SESSION/AUTHENTICATED on unrelated child-machine transitions — e.g.
  // a guest editing the checkout email drives the client machine
  // (SET → checking → valid) and the basket needlessly re-syncs on every change.
  let lastStatus: string | undefined;
  const emit = (event: { type: string }) => {
    if (event.type === lastStatus) return;
    lastStatus = event.type;
    callback(event);
  };

  // Latest parent (session) state, kept fresh by the outer subscribe below. The
  // parent's context (which child machine is active) only changes on a parent
  // transition, so this stays accurate for authCallback; the child actor refs
  // on it are live, so a child-internal transition still reads correctly.
  let latest: State<any, any, any, any, any> | undefined;

  // One child subscription at a time — disposed and re-armed on the
  // guest→client actor swap, so we attach exactly one listener per instance.
  let watched: any;
  let watchedSub: Subscription | undefined;

  onReceive((event: any) => {
    // do nothing for now
    // console.debug("authSubscription", "receivedEvent", { event });
  });

  // then listen for any changes to the client service
  // if we get a change to either authenticated or unauthenticated
  // then we need to send the callback to the subscriber
  const subcscription = subscribe(state => {
    if (state.done) return; // service has stopped so exit

    latest = state;

    const currentMachine =
      state?.children?.clientMachine || state?.children?.guestMachine;

    // The parent subscribe doesn't fire on a child's internal async transitions
    // (e.g. loading → available once its invoke resolves), so watch the child
    // directly — exactly one subscription per instance, reading the latest
    // parent state rather than a stale closed-over one.
    if (currentMachine && currentMachine !== watched) {
      watchedSub?.unsubscribe();
      watched = currentMachine;
      watchedSub = currentMachine.subscribe(() => {
        if (latest) hasSession = authCallback(latest, hasSession, emit);
      });
    }

    hasSession = authCallback(state, hasSession, emit);
  });

  return () => {
    // The subscriber has unsubscribed from this service
    // typically when the transitioning out of the state node
    watchedSub?.unsubscribe();
    subcscription.unsubscribe();
  };
};
