// --- internal
import { useSession } from "../session";
import { useBasketProduct } from "../basketProduct";

// --- utils
import { NotAuthenticatedError } from "../../utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { DomainRegistrantContext } from "./types";

// -----------------------------------------------------------------------------
/**
 * @module domainRegistrant/services
 * @description Services for the domain registrant machine.
 */

// -----------------------------------------------------------------------------

async function loadLookups(
  _context: DomainRegistrantContext,
  _event: AnyEventObject
) {
  const { meta, client } = useSession();

  if (!meta.value.isAuthenticated || !client.value?.id) {
    throw new NotAuthenticatedError();
  }

  // Domain products are synced via basket subscription REFRESH events
  return {};
}

async function saveToBasket(context: DomainRegistrantContext) {
  const productId = context.savingProductId;
  if (!productId) throw new Error("No product ID to save");

  const productState = context.products.get(productId);
  if (!productState) throw new Error("Product not found");

  const { setProvisioningFields, update } = useBasketProduct(productId);
  await setProvisioningFields(productState.data);
  await update();
}

export default {
  loadLookups,
  saveToBasket,
  isAuthenticated: () => useSession().isAuthenticated()
};
