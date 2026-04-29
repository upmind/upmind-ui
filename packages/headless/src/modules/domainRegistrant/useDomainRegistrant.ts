// --- external
import { computed } from "vue";
import { interpret, InterpreterStatus } from "xstate";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import registrantMachine from "./domainRegistrant.machine";

// --- utils
import { contextValue, stateMatches, useContext } from "../../utils";
import { filter, isEmpty } from "lodash-es";

// --- types
import type { Address, Company } from "../client";
import type { DomainRegistrantContext } from "./types";

// -----------------------------------------------------------------------------
/**
 * @module domainRegistrant/useDomainRegistrant
 * @description Composable for managing per-domain registrant details. Wraps the
 * registrant XState machine which acts as a conduit between billing details
 * and basket product provision fields.
 *
 * Key concepts:
 * - `model`: Selected product IDs (from checkboxes)
 * - `domains`: Domain products from basket
 * - Machine is a conduit - basketProduct is source of truth for actual data
 */

// -----------------------------------------------------------------------------

// Singleton service - started lazily on first use (same pattern as useSession)
const service = interpret(registrantMachine, { devTools: true });

// -----------------------------------------------------------------------------

/**
 * Composable for managing registrant details on domain products in the basket.
 *
 * Provides state tracking, billing pre-fill, per-domain editing, and provision
 * field persistence. Used by the registrant details flow (FE-2457) between
 * billing and checkout.
 */
export function useDomainRegistrant() {
  // Start service lazily on first use (same pattern as useSession)
  if (service.status === InterpreterStatus.NotStarted) {
    service.start();
  }

  const { state, send } = useActor(service);

  // --- context

  /** Selected product IDs (from checkboxes) */
  const model = useContext<NonNullable<DomainRegistrantContext["model"]>>(
    state,
    "model",
    []
  );

  /** Error from last operation */
  const error = useContext<DomainRegistrantContext["error"]>(state, "error");

  /** Domain products from basket */
  const domains = computed(() => {
    const lookups = contextValue<DomainRegistrantContext["lookups"]>(
      state,
      "lookups"
    );
    return lookups?.basketProducts ?? [];
  });

  /** Domain products that are invalid or missing provision fields */
  const invalidDomains = computed(() =>
    filter(
      domains.value,
      d => d.meta?.invalid || isEmpty(d.configuration.provisionFields)
    )
  );

  // --- meta

  const meta = computed(() => ({
    /** True when machine is available (has domains). */
    isAvailable: stateMatches(state.value, "available"),
    /** True when all domain registrant details are complete. */
    isComplete: stateMatches(state.value, "complete"),
    /** True when there are no domain products in the basket. */
    isEmpty: isEmpty(domains.value),
    /** True when the machine is processing a save. */
    isProcessing: stateMatches(state.value, "available.processing"),
    /** True when machine has finished subscribing. */
    isReady: !stateMatches(state.value, ["subscribing", "loading"])
  }));

  // --- methods

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      s => stateMatches(s, ["available", "unavailable", "complete"]),
      { timeout: Infinity }
    )
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Set selected product IDs (from checkboxes).
   * Machine updates `model` with these IDs.
   */
  async function select(bpids: string[]): Promise<void> {
    send({ type: "SET", data: bpids });
    return waitFor(
      service,
      state =>
        stateMatches(state, ["available.idle", "unavailable", "complete"]),
      { timeout: 60_000 }
    )
      .then(() => Promise.resolve())
      .catch(err => Promise.reject(err));
  }

  /**
   * Apply billing to selected products and save to basket.
   *
   * @param billing - Address or Company to apply
   * @param bpids - Optional override for product IDs (uses model if not provided)
   */
  async function applyBilling(
    billing: Address | Company,
    bpids?: string[]
  ): Promise<void> {
    send({ type: "APPLY_BILLING", data: { billing, bpids } });
    return waitFor(
      service,
      state =>
        stateMatches(state, [
          "available.processing",
          "unavailable",
          "complete"
        ]),
      { timeout: 60_000 }
    )
      .then(state => {
        if (state.context.error) {
          throw state.context.error;
        }
        return Promise.resolve();
      })
      .catch(err => Promise.reject(err));
  }

  /**
   * Apply provision field data to selected products.
   * Used after inline edit on Review page.
   *
   * @param data - Provision field data to apply
   * @param bpids - Optional override for product IDs (uses model if not provided)
   */
  async function applyProvision(
    data: Record<string, string>,
    bpids?: string[]
  ): Promise<void> {
    send({ type: "APPLY_PROVISION", data: { provision: data, bpids } });
    return waitFor(
      service,
      state =>
        stateMatches(state, ["available.idle", "unavailable", "complete"]),
      { timeout: 60_000 }
    )
      .then(state => {
        if (state.context.error) {
          throw state.context.error;
        }
        return Promise.resolve();
      })
      .catch(err => Promise.reject(err));
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state
    /** Wait for the machine to be ready. */
    isReady,
    /** Meta flags for UI state. */
    meta,

    // --- context
    /** Domain products from basket. */
    domains,
    /** Error from last operation. */
    error,
    /** Domain products that are invalid or missing provision fields. */
    invalidDomains,
    /** Selected product IDs. */
    model,

    // --- methods
    /** Apply billing source to selected products and save. */
    applyBilling,
    /** Apply provision fields to selected products. */
    applyProvision,
    /** Set selected product IDs. */
    select
  };
}

/** The return type of {@link useDomainRegistrant} composable. */
export type UseDomainRegistrant = ReturnType<typeof useDomainRegistrant>;
