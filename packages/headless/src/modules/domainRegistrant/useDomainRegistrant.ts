// --- external
import { computed } from "vue";
import { useActor, useInterpret } from "@xstate/vue";

// --- internal
import registrantMachine from "./domainRegistrant.machine";

// --- utils
import { contextValue, useContext } from "../../utils";
import { isEmpty } from "lodash-es";

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

// Singleton service
const registrantService = useInterpret(registrantMachine, { devTools: true });

// -----------------------------------------------------------------------------

/**
 * Composable for managing registrant details on domain products in the basket.
 *
 * Provides state tracking, billing pre-fill, per-domain editing, and provision
 * field persistence. Used by the registrant details flow (FE-2457) between
 * billing and checkout.
 */
export function useDomainRegistrant() {
  const { state, send } = useActor(registrantService);

  // --- context

  /** Selected product IDs (from checkboxes) */
  const model = useContext<DomainRegistrantContext["model"]>(state, "model");

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

  // --- meta

  const meta = computed(() => ({
    /** True when the basket contains any domain products. */
    hasDomainProducts: !isEmpty(domains.value),
    /** True when the machine is processing a save. */
    isProcessing: state.value.matches("available.processing"),
    /** True when machine is available and ready for interaction. */
    isReady: state.value.matches("available"),
    /** True when machine is unavailable (no domains). */
    isUnavailable: state.value.matches("unavailable")
  }));

  // --- methods

  /**
   * Set selected product IDs (from checkboxes).
   * Machine updates `model` with these IDs.
   */
  function setSelected(productIds: string[]): void {
    send({ type: "SET", productIds });
  }

  /**
   * Apply billing to selected products and save to basket.
   *
   * @param billing - Address or Company to apply
   * @param productIds - Optional override for product IDs (uses model if not provided)
   */
  function applyBilling(
    billing: Address | Company,
    productIds?: string[]
  ): void {
    send({ type: "APPLY_BILLING", billing, productIds });
  }

  /**
   * Apply provision field data to selected products.
   * Used after inline edit on Review page.
   *
   * @param data - Provision field data to apply
   * @param productIds - Optional override for product IDs (uses model if not provided)
   */
  function applyProvision(
    data: Record<string, string>,
    productIds?: string[]
  ): void {
    send({ type: "APPLY_PROVISION", data, productIds });
  }

  // ---------------------------------------------------------------------------
  return {
    // --- context
    /** Domain products from basket. */
    domains,
    /** Error from last operation. */
    error,
    /** Selected product IDs. */
    model,

    // --- meta
    /** Meta flags for UI state. */
    meta,

    // --- methods
    /** Apply billing source to selected products and save. */
    applyBilling,
    /** Apply provision fields to selected products. */
    applyProvision,
    /** Set selected product IDs. */
    setSelected
  };
}

/** The return type of {@link useDomainRegistrant} composable. */
export type UseDomainRegistrant = ReturnType<typeof useDomainRegistrant>;
