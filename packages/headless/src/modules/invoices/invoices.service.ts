import { useQuery } from "../query";
import { useActiveSession } from "../session-store";
import { mapInvoice } from "./invoices.mappers";
import { useTime, NotAuthenticatedError } from "../../utils";
import type { Invoice } from "./invoices.types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IInvoice } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["invoices"];

function loadInvoice({ invoiceId }: { invoiceId: Invoice["id"] }) {
  const { isAuthenticated } = useActiveSession().useMeta();
  const { activeUser } = useActiveSession().useContext();
  const { query, useUrl } = useQuery();

  return query<IInvoice, Invoice>({
    url: useUrl(`/invoices/${invoiceId}`, {
      with: [
        "brand",
        "taxes",
        "client",
        "status",
        "contract",
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
    queryKey: [...queryKey, { invoiceId }],
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (isAuthenticated.value && !!activeUser.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    // --- options
    retry: 1,
    select: mapInvoice,
    staleTime: useTime()?.DAY,
    refetchOnWindowFocus: false,
    enabled: () => isAuthenticated.value && !!activeUser.value?.id
  });
}

export default {
  queryKey,
  //--- queries
  loadInvoice
};
