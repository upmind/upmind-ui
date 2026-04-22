// --- external
import { computed } from "vue";
import { useActor, useInterpret } from "@xstate/vue";

// --- internal
import registrantMachine from "./domainRegistrant.machine";

// --- utils
import { contextValue, useContext } from "../../utils";
import { every, filter, isEmpty, size } from "lodash-es";

// --- types
import type { Address, Company } from "../client";
import {
  DOMAIN_REGISTRANT_PRODUCT_STATUS,
  type DomainRegistrantContext,
  type DomainRegistrantProductState
} from "./types";

// -----------------------------------------------------------------------------
/**
 * @module domainRegistrant/useDomainRegistrant
 * @description Composable for managing per-domain registrant details. Wraps the
 * registrant XState machine which acts as a conduit between billing details
 * and basket product provision fields.
 */

// -----------------------------------------------------------------------------

// Singleton service
const registrantService = useInterpret(registrantMachine, { devTools: true });

// -----------------------------------------------------------------------------

/**
 * Composable for managing registrant details on domain products in the basket.
 *
 * Provides state tracking, billing pre-fill, per-domain editing, completeness
 * validation, and provision field persistence. Used by the registrant details
 * flow (FE-2457) between billing and checkout.
 */
export function useDomainRegistrant() {
  const { state, send } = useActor(registrantService);

  // --- context

  /** Billing source for pre-filling */
  const model = useContext<DomainRegistrantContext["model"]>(state, "model");

  /** Error from last operation */
  const error = useContext<DomainRegistrantContext["error"]>(state, "error");

  /** Per-domain registrant products as array (for iteration) */
  const products = computed(() => {
    const values = contextValue<DomainRegistrantContext["products"]>(
      state,
      "products"
    )?.values();

    if (!values) return [];
    return Array.from(values);
  });

  // --- meta

  const meta = computed(() => ({
    /** True when all domains are complete or skipped. */
    isComplete: every(
      products.value,
      (p: DomainRegistrantProductState) =>
        p.status === DOMAIN_REGISTRANT_PRODUCT_STATUS.COMPLETE ||
        p.status === DOMAIN_REGISTRANT_PRODUCT_STATUS.SKIPPED
    ),
    /** True when the basket contains any domain products. */
    hasDomainProducts: !isEmpty(products.value),
    /** True when the machine is processing a save. */
    isProcessing: state.value.matches("available.processing")
  }));

  /** Number of domains still needing registrant data */
  const pendingCount = computed(() =>
    size(
      filter(products.value, [
        "status",
        DOMAIN_REGISTRANT_PRODUCT_STATUS.INCOMPLETE
      ])
    )
  );

  // --- methods

  /**
   * Set billing source for pre-filling registrant data.
   * Machine handles mapping to provision fields.
   */
  function setBilling(source: Address | Company | null): void {
    send({ type: "SET_BILLING", data: source });
  }

  /**
   * Apply billing source to selected domain products.
   *
   * @param productIds - Basket product IDs to pre-fill
   */
  function applyBilling(productIds: string[]): void {
    send({ type: "APPLY_BILLING", productIds });
  }

  /**
   * Update registrant data for a single domain product.
   *
   * @param productId - Basket product ID
   * @param data - Registrant data keyed by provision field name
   */
  function set(productId: string, data: Record<string, string>): void {
    send({ type: "SET", productId, data });
  }

  /**
   * Save registrant details to basket product via provision fields.
   *
   * @param productId - Basket product ID to save
   */
  function save(productId: string): void {
    send({ type: "SAVE", productId });
  }

  /**
   * Mark a domain product as explicitly skipped (escape hatch).
   *
   * @param productId - Basket product ID to skip
   */
  function skip(productId: string): void {
    send({ type: "SKIP", productId });
  }

  /**
   * Un-skip a previously skipped domain product.
   *
   * @param productId - Basket product ID to un-skip
   */
  function unskip(productId: string): void {
    send({ type: "UNSKIP", productId });
  }

  /**
   * Get registrant state for a specific product.
   *
   * @param productId - Basket product ID
   * @returns Current registrant state or undefined
   */
  function getProduct(
    productId: string
  ): DomainRegistrantProductState | undefined {
    return state.value.context.products.get(productId);
  }

  // ---------------------------------------------------------------------------
  return {
    // --- context
    /** Error from last operation. */
    error,
    /** Billing source for pre-filling. */
    model,
    /** Number of domains still needing registrant data. */
    pendingCount,
    /** Per-product registrant states from the machine. */
    products,

    // --- meta
    /** Meta flags for UI state. */
    meta,

    // --- methods
    /** Apply billing source to selected products. */
    applyBilling,
    /** Get registrant state for a specific product. */
    getProduct,
    /** Save registrant as provision fields on product actor. */
    save,
    /** Update registrant data for one domain. */
    set,
    /** Set billing source for pre-filling. */
    setBilling,
    /** Skip registrant for a domain (escape hatch). */
    skip,
    /** Un-skip a previously skipped domain product. */
    unskip
  };
}

/** The return type of {@link useDomainRegistrant} composable. */
export type UseDomainRegistrant = ReturnType<typeof useDomainRegistrant>;
