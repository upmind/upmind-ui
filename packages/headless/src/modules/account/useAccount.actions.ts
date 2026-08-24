import { unref } from "vue";
import { remove } from "../scope";
import {
  contextValue,
  stateMatches,
  stopService,
  waitForProcessing
} from "../../utils";
import type {
  CompleteRegistrationModel,
  GuestEmailModel,
  VerifyEmailModel
} from "./account.types";
import type { UseActor } from "../../utils";
import type { Client } from "../client";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module account/useAccount.actions
 * @description Account actions factory (machine events).
 */

/**
 * Creates account actions that send events to the machine.
 * @internal
 */
export function createAccountActions(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { state, send, service } = actor;

  function cancel(): void {
    send({ type: "CANCEL" });
  }

  function resend(): void {
    send({ type: "RESEND" });
  }

  function set(
    data?: CompleteRegistrationModel | GuestEmailModel | VerifyEmailModel
  ): void {
    send({ type: "SET", data });
  }

  function showGuestEmail(): void {
    send({ type: "EMAIL" });
  }

  /**
   * Smart resolve function that routes to the correct action based on current state.
   */
  async function resolve(
    model: CompleteRegistrationModel | GuestEmailModel | VerifyEmailModel
  ): Promise<boolean> {
    const data = unref(model) ?? {};
    if (stateMatches(state, "register"))
      return register(data as CompleteRegistrationModel);
    if (stateMatches(state, "unverified"))
      return verify(data as VerifyEmailModel);
    return Promise.resolve(false);
  }

  async function updateGuestEmail(data: GuestEmailModel): Promise<boolean> {
    // No-op when the email already matches what's persisted on the client
    // (BE leaves a guest's email in `username`) — avoids a redundant PUT on
    // every blur if the user hasn't actually changed the value.
    const client = contextValue<Client>(state, "client");
    const persisted = client?.email ?? client?.username;
    if (data.email === persisted) return true;

    service.send({ type: "UPDATE_GUEST_EMAIL", data });

    return waitForProcessing(service, "available.unregistered", [
      "done",
      "available.unregistered.error"
    ]);
  }

  /**
   * Submits verification code and waits for result.
   * @returns true on success (machine in `verified`), false on error
   */
  async function verify(data: VerifyEmailModel): Promise<boolean> {
    send({ type: "VERIFY", data });
    return waitForProcessing(service, "available.verified", [
      "available.unverified.challenging.invalid",
      "available.unverified.challenging.error"
    ]);
  }

  /**
   * Submits registration details and waits for result.
   * @returns true on success (machine in `verified`), false on error
   */
  async function register(model: CompleteRegistrationModel): Promise<boolean> {
    const data = unref(model);
    send({ type: "COMPLETE_REGISTRATION", data });
    return waitForProcessing(
      service,
      ["available.verified", "available.unverified", "complete", "done"],
      "available.unregistered.error"
    );
  }

  /**
   * Destroys the account instance - stops the service and removes from registry.
   * Call this on component unmount to properly clean up.
   */
  function destroy(): void {
    stopService(service);
    remove(scopeKey);
  }

  // -----------------------------------------------------------------------------
  return {
    /** Cancels the active account form (verify-email / guest-upgrade). */
    cancel,

    /** Destroys this scoped instance — stops the service and removes from registry. */
    destroy,

    /** Completes guest → full client registration (upgrade form). */
    register,

    /** Resends the verification email (cooldown-gated). */
    resend,

    /** Routes to the correct action based on current state. */
    resolve,

    /** Sets the active account form model. */
    set,

    /** Switches the account form to the guest order-receipt email schema. */
    showGuestEmail,

    /** Autosaves the guest client's order-receipt email. */
    updateGuestEmail,

    /** Submits the email-verification OTP code for an unverified client. */
    verify
  };
}

// Type export for consumers
export type UseAccountActions = ReturnType<typeof createAccountActions>;
