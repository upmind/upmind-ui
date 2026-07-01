/** @internal */
import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { NotAuthenticatedError } from "../../utils";
import type { OrderContext } from "./order.types";
import type { IInvoice } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
/**
 * @module orders/order.services
 * @description Services for the order payment orchestrator machine.
 */

async function loadLookups(
  { invoiceId }: OrderContext,
  _event: AnyEventObject
): Promise<IInvoice> {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser } = useActiveSession().useContext();
  const { get, useUrl } = useQuery();

  if (!isAuthenticated.value || !activeUser.value?.id) {
    throw new NotAuthenticatedError();
  }

  return get<IInvoice>({
    url: useUrl(`/invoices/${invoiceId}`, {
      with: [
        "brand",
        "taxes",
        "client",
        "status",
        "contract",
        "address",
        "address.country",
        "payments",
        "payments.payment_details",
        "products",
        "promotions",
        "client.tags",
        "products.tags",
        "taxes.tax_tag_data",
        "custom_fields.field",
        "affiliate_commissions",
        "products.product.image",
        "account.affiliate_referral.affiliate_account.account.client"
      ].join(",")
    }),
    queryKey: ["order", invoiceId],
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0
  });
}

export default {
  loadLookups,
  refresh: loadLookups, // alias
  isAuthenticated: () => useActiveSession().useActions().isReady()
};
