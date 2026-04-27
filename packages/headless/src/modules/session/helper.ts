// --- external

// --- internal
import { useSession } from "./";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { State } from "xstate";
import { getTokenFromStorage } from "./utils";
import { stateMatches } from "../../utils";
import { Contexts } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
// We have a valid AUTH session when we are logged in as a client (TODO: admin + actor)
// `unverified` is treated as a valid client session — the client is
// authenticated, just required to verify their email before checkout.
type AuthSnapshot = { hasSession: boolean; isAuthenticated: boolean };

const computeAuth = (state: State<any, any, any, any, any>): AuthSnapshot => {
  const clientMachine = state?.children?.clientMachine;
  const guestMachine = state?.children?.guestMachine;

  // Hard-drop on session-level errors / expiry.
  if (stateMatches(state, ["expired", "checking", "error"])) {
    return { hasSession: false, isAuthenticated: false };
  }
  // Hard-drop on client logout (machine reached its final state).
  if (
    state.matches(Contexts.CLIENT) &&
    stateMatches(clientMachine, ["complete", "done"])
  ) {
    return { hasSession: false, isAuthenticated: false };
  }
  // Guest loading after a previous session = unauthenticated transition.
  if (state.matches(Contexts.GUEST) && stateMatches(guestMachine, "loading")) {
    return { hasSession: false, isAuthenticated: false };
  }

  // In client context: `loading` is a transient refresh (e.g. REFRESH event),
  // NOT a logout. Treat it as still session-bearing so consumers (basket,
  // payment) don't churn through UNAUTHENTICATED → SESSION on every reload.
  const sessionStates = state.matches(Contexts.CLIENT)
    ? ["available", "unverified", "loading"]
    : ["available", "unverified"];

  if (
    !stateMatches(
      state.matches(Contexts.CLIENT) ? clientMachine : guestMachine,
      sessionStates
    )
  ) {
    return { hasSession: false, isAuthenticated: false };
  }

  const hasSession = !isEmpty(getTokenFromStorage());
  const isAuthenticated =
    hasSession &&
    state.matches(Contexts.CLIENT) &&
    stateMatches(clientMachine, sessionStates);

  return { hasSession, isAuthenticated };
};

export const authSubscription = async (callback: any, onReceive: any) => {
  const { subscribe } = useSession();

  // Latch the last-emitted snapshot so we only fire SESSION / AUTHENTICATED /
  // UNAUTHENTICATED on actual transitions, not on every child-machine tick.
  let last: AuthSnapshot = { hasSession: false, isAuthenticated: false };

  onReceive((_event: any) => {
    // do nothing for now
  });

  const dispatch = (state: State<any, any, any, any, any>) => {
    const next = computeAuth(state);

    if (next.hasSession && !last.hasSession) {
      callback({ type: "SESSION" });
    }
    if (next.isAuthenticated && !last.isAuthenticated) {
      callback({ type: "AUTHENTICATED" });
    }
    if (!next.hasSession && last.hasSession) {
      callback({ type: "UNAUTHENTICATED" });
    }

    last = next;
  };

  const subcscription = subscribe(state => {
    if (state.done) return; // service has stopped so exit

    const currentMachine =
      state?.children?.clientMachine || state?.children?.guestMachine;

    if (currentMachine) {
      // @ts-ignore -- onTransition exists at runtime even if not in types
      currentMachine?.onTransition(() => dispatch(state));
    }

    dispatch(state);
  });

  return () => {
    subcscription.unsubscribe();
  };
};
