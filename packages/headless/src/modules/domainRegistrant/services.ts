// --- internal
import { useSession } from "../session";
import { useBasketProduct } from "../basketProduct";

// --- utils
import { NotAuthenticatedError } from "../../utils";
import { mapBillingToProvisionFields, mapProvisionFields } from "./utils";
import { filter, includes, isEmpty, map } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { DomainRegistrantContext } from "./types";
import { DomainRegistrantEventType } from "./types";

// -----------------------------------------------------------------------------
/**
 * @module domainRegistrant/services
 * @description Services for the domain registrant machine.
 */

// -----------------------------------------------------------------------------

async function applyToBasket(
  { model, lookups }: DomainRegistrantContext,
  { type, data }: AnyEventObject
) {
  const selectedProducts = filter(lookups.basketProducts, product =>
    includes(model, product.id)
  );

  // if we're applying billing/provision data, but no products are selected, do nothing
  if (isEmpty(selectedProducts)) return;

  const isProvision = type === DomainRegistrantEventType.APPLY_PROVISION;

  const updates = map(selectedProducts, product => {
    const basketProduct = useBasketProduct(product.id);
    const existing = basketProduct.model.value?.provisionFields;

    const dataToApply = isProvision
      ? mapProvisionFields(data?.provision, existing)
      : mapBillingToProvisionFields(data?.billing, existing);

    return basketProduct
      .setProvisioningFields(dataToApply)
      .then(() => basketProduct.update());
  });
  return Promise.allSettled(updates).then(results => {
    return results;
  });
}

async function loadLookups() {
  const { meta, client } = useSession();

  if (!meta.value.isAuthenticated || !client.value?.id) {
    throw new NotAuthenticatedError();
  }

  return {};
}

export default {
  applyToBasket,
  loadLookups,
  isAuthenticated: () => useSession().isAuthenticated()
};
