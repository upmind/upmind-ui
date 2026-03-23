// --- external
import { computed, ref, watch } from "vue";

// --- internal
import { useBasket } from "../basket";
import { useBasketProduct } from "../basketProduct";

// --- utils
import { every, filter, forEach, get, isEmpty, map, merge } from "lodash-es";
import {
  emptyRegistrant,
  getDomainBasketProducts,
  getMissingRegistrantFields,
  hasAllRequiredRegistrantFields,
  mapBillingToRegistrant,
  mapRegistrantToProvisionFields
} from "./utils";

// --- types
import type { DomainRegistrantStatus, RegistrantDetails } from "./types";
import type { BasketProduct } from "../basketProduct";

// -----------------------------------------------------------------------------
/**
 * @module domain/useDomainRegistrant
 * @description Composable for managing per-domain registrant details. Tracks
 * completeness of registrant data for domain products in the basket, supports
 * pre-filling from billing details, and saves registrant data as provision
 * field values on basket product actors.
 */

// -----------------------------------------------------------------------------

/**
 * Composable for managing registrant details on domain products in the basket.
 *
 * Provides state tracking, billing pre-fill, per-domain editing, completeness
 * validation, and provision field persistence. Used by the registrant details
 * flow (FE-2457) between billing and checkout.
 */
export function useDomainRegistrant() {
  const { products } = useBasket();

  // --- state

  /** Reactive map of productId → RegistrantDetails */
  const registrants = ref<Map<string, RegistrantDetails>>(new Map());

  /** Set of productIds that the user has explicitly skipped */
  const skippedProducts = ref<Set<string>>(new Set());

  // --- computed

  /** Domain-only products from the basket */
  const domainProducts = computed<BasketProduct[]>(() =>
    getDomainBasketProducts(products.value)
  );

  /** Whether the basket contains any domain products */
  const hasDomainProducts = computed<boolean>(
    () => !isEmpty(domainProducts.value)
  );

  /** Per-domain registrant status with completeness tracking */
  const statuses = computed<DomainRegistrantStatus[]>(() =>
    map(domainProducts.value, (product: BasketProduct) => {
      const registrant = registrants.value.get(product.id) ?? emptyRegistrant();
      return {
        productId: product.id,
        domain:
          product.serviceIdentifier ??
          get(product, "configuration.provisionFields.sld", product.id),
        registrant,
        complete: hasAllRequiredRegistrantFields(registrant),
        missingFields: getMissingRegistrantFields(registrant),
        skipped: skippedProducts.value.has(product.id)
      };
    })
  );

  /** True when every domain product is either complete or explicitly skipped */
  const isComplete = computed<boolean>(() =>
    every(
      statuses.value,
      (s: DomainRegistrantStatus) => s.complete || s.skipped
    )
  );

  /** Count of domain products still needing registrant data */
  const pendingCount = computed<number>(
    () =>
      filter(
        statuses.value,
        (s: DomainRegistrantStatus) => !s.complete && !s.skipped
      ).length
  );

  // --- methods

  /**
   * Pre-fill registrant details from a billing/client data source
   * for the given product IDs.
   *
   * @param productIds - Basket product IDs to pre-fill
   * @param source - Flat object with billing field values (name, email, phone, etc.)
   */
  function applyBillingToProducts(
    productIds: string[],
    source: Record<string, any>
  ): void {
    const registrant = mapBillingToRegistrant(source);
    forEach(productIds, (id: string) => {
      registrants.value.set(id, { ...registrant });
    });
  }

  /**
   * Update registrant details for a single domain product.
   * Merges partial updates into the existing registrant data.
   *
   * @param productId - Basket product ID
   * @param details - Partial registrant field updates
   */
  function updateRegistrant(
    productId: string,
    details: Partial<RegistrantDetails>
  ): void {
    const existing = registrants.value.get(productId) ?? emptyRegistrant();
    registrants.value.set(productId, merge({}, existing, details));
    // Un-skip if the user is now editing
    skippedProducts.value.delete(productId);
  }

  /**
   * Save registrant details as provision field values on the basket product.
   * Maps registrant fields → provision field keys and sends SET.PROVISIONING
   * event via the product actor.
   *
   * @param productId - Basket product ID to save registrant for
   */
  async function saveRegistrant(productId: string): Promise<void> {
    const registrant = registrants.value.get(productId);
    if (!registrant) return;

    const provisionFields = mapRegistrantToProvisionFields(registrant);
    const { setProvisioningFields, update } = useBasketProduct(productId);
    await setProvisioningFields(provisionFields);
    await update();
  }

  /**
   * Mark a domain product as explicitly skipped (escape hatch).
   * Skipped products won't block the checkout guard.
   *
   * @param productId - Basket product ID to skip
   */
  function skip(productId: string): void {
    skippedProducts.value.add(productId);
  }

  /**
   * Un-skip a previously skipped domain product.
   *
   * @param productId - Basket product ID to un-skip
   */
  function unskip(productId: string): void {
    skippedProducts.value.delete(productId);
  }

  /**
   * Get registrant details for a specific product.
   *
   * @param productId - Basket product ID
   * @returns Current registrant details or empty registrant
   */
  function getRegistrant(productId: string): RegistrantDetails {
    return registrants.value.get(productId) ?? emptyRegistrant();
  }

  // --- watchers

  // Clean up stale registrant data when domain products are removed
  watch(
    domainProducts,
    (current: BasketProduct[]) => {
      const currentIds = new Set(map(current, "id"));

      // Remove registrants for products no longer in basket
      registrants.value.forEach((_value, key) => {
        if (!currentIds.has(key)) {
          registrants.value.delete(key);
          skippedProducts.value.delete(key);
        }
      });
    },
    { deep: true }
  );

  // ---------------------------------------------------------------------------
  return {
    // --- state
    /** Domain-only products from the basket. */
    domainProducts,
    /** Whether the basket contains any domain products. */
    hasDomainProducts,
    /** True when all domains are complete or skipped. */
    isComplete,
    /** Number of domains still needing registrant data. */
    pendingCount,
    /** Reactive map of productId → RegistrantDetails. */
    registrants,
    /** Per-domain registrant statuses with completeness tracking. */
    statuses,

    // --- methods
    /** Pre-fill registrant details from billing for selected products. */
    applyBillingToProducts,
    /** Get registrant details for a specific product. */
    getRegistrant,
    /** Save registrant as provision fields on product actor. */
    saveRegistrant,
    /** Skip registrant for a domain (escape hatch). */
    skip,
    /** Un-skip a previously skipped domain product. */
    unskip,
    /** Update registrant details for one domain. */
    updateRegistrant
  };
}

/** The return type of {@link useDomainRegistrant} composable. */
export type UseDomainRegistrant = ReturnType<typeof useDomainRegistrant>;
