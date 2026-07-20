import { unref } from "vue";
import { ScopeActorTypes } from "../scope";
import { remove } from "../scope";
import { createClientAuthActions } from "./useAuth.actions.client";
import { createStaffAuthActions } from "./useAuth.actions.staff";
import {
  contextValue,
  stateMatches,
  stopService,
  waitForProcessing
} from "../../utils";
import type {
  AuthModel,
  AuthResult,
  LoginModel,
  RecoverModel,
  RegisterModel,
  TwoFAModel
} from "./auth.types";
import type { UseActor } from "../../utils";
import type { State } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module auth/useAuth.actions
 * @description Auth actions factory.
 * Creates actor-aware actions by merging shared methods with actor-specific ones.
 */
// -----------------------------------------------------------------------------
/**
 * Creates auth actions by merging shared methods with actor-specific ones.
 * @param actorScope - The actor scope (client, staff, guest)
 * @param actor - The actor reference from XState
 * @param scopeKey - The scope key for registry cleanup on destroy
 * @internal
 */
export function createAuthActions(
  actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { send, service, state } = actor;

  /**
   * Authenticate with username/password.
   * @private
   */
  async function login(model: LoginModel): Promise<boolean> {
    const data = unref(model);
    send({ type: "AUTHENTICATE", data });
    return waitForProcessing(
      service,
      ["authenticated", "done"],
      "login.available.error"
    );
  }

  /**
   * Verify 2FA code.
   * @private
   */
  async function verify2fa(model: TwoFAModel): Promise<boolean> {
    const { token } = model;
    send({ type: "VERIFY", data: token });
    return waitForProcessing(
      service,
      ["authenticated", "done"],
      "login.challenging.invalid"
    );
  }

  /**
   * Register a new account.
   * @private
   */
  async function register(model: RegisterModel): Promise<boolean> {
    const data = unref(model);
    send({ type: "REGISTER", data });
    return waitForProcessing(
      service,
      ["authenticated", "done"],
      "register.available.error"
    );
  }

  /**
   * Initiate password recovery.
   * @private
   */
  async function recover(model: RecoverModel): Promise<boolean> {
    const data = unref(model);
    send({ type: "RECOVER", data });
    return waitForProcessing(
      service,
      ["recover.complete", "done"],
      "recover.available.error"
    );
  }

  /**
   * Set/update the form model data.
   */
  function set(model: unknown): void {
    send({ type: "SET", data: model });
  }

  /**
   * Cancel the current operation.
   */
  function reject(): Promise<boolean> {
    send({ type: "CANCEL" });
    return waitForProcessing(service, [
      "idle",
      "login.available",
      "register.available",
      "recover.available"
    ]);
  }

  /**
   * Smart resolve function that routes to the correct action based on current state.
   */
  async function resolve(model?: AuthModel | undefined): Promise<boolean> {
    const data = unref(model) ?? {};
    if (stateMatches(state, "login.challenging"))
      return verify2fa(data as TwoFAModel);
    if (stateMatches(state, "login")) return login(data as LoginModel);
    if (stateMatches(state, "register")) return register(data as RegisterModel);
    if (stateMatches(state, "recover")) return recover(data as RecoverModel);
    return Promise.resolve(false);
  }

  /**
   * Register callback for when the auth flow completes SUCCESSFULLY (machine
   * reaches its `authenticated` final state).
   */
  function onDone(callback: (data: AuthResult) => void) {
    (
      service as unknown as {
        onDone?: (cb: (event: { data?: unknown }) => void) => void;
      }
    ).onDone?.(event => {
      if (event.data) callback(event.data as AuthResult);
    });
  }

  /**
   * Register callback for when the auth attempt settles into a FAILURE state.
   * Mirrors `onDone` (success): an unattended caller (e.g. the guest-token mint
   * on boot) can register both and never hang on a failed attempt — the old
   * `onDone`-only wait never settled on failure. Fires at most once, with the
   * context error.
   *
   */
  function onError(callback: (error?: unknown) => void): void {
    let handled = false;
    let primed = false;
    const subscription = (
      service as unknown as {
        subscribe: (cb: (snapshot: State<any>) => void) => {
          unsubscribe: () => void;
        };
      }
    ).subscribe(snapshot => {
      // xstate emits the current state synchronously on subscribe; skip that
      // first emission so onError fires only on a real transition into a
      // settle state (and never touches `subscription` before it is assigned).
      if (!primed) return;
      if (
        handled ||
        !stateMatches(snapshot, [
          "login.available.error",
          "register.available.error",
          "recover.available.error",
          "idle",
          "error"
        ])
      )
        return;
      handled = true;
      subscription.unsubscribe();
      callback(contextValue(snapshot, "error"));
    });
    primed = true;
  }

  /**
   * Destroys the auth instance - stops the service and removes from registry.
   * Call this on component unmount to properly clean up.
   */
  function destroy(): void {
    stopService(service);
    remove(scopeKey);
  }

  // --- actor-specific actions
  const actorActions =
    actorScope === ScopeActorTypes.STAFF
      ? createStaffAuthActions(actor)
      : createClientAuthActions(actor);

  return { destroy, onDone, onError, reject, resolve, set, ...actorActions };
}

// Type export for consumers
export type UseAuthActions = ReturnType<typeof createAuthActions>;
