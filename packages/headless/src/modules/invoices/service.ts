// --- internal
import { useQuery } from "../query";
import { useSession } from "../session";

// --- utils
import { parseInvoice } from "./mappers";
import { useTime, NotAuthenticatedError } from "../../utils";

// --- types
import type { Invoice } from "./types";
import type { QueryKey } from "@tanstack/vue-query";
import type { IInvoice } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// QUERIES

const queryKey: QueryKey = ["invoices"];

function loadInvoice({ invoiceId }: { invoiceId: Invoice["id"] }) {
  const { meta, user } = useSession();
  const { list, useUrl } = useQuery();

  return list<IInvoice, Invoice>({
    url: useUrl(`/invoices/${invoiceId}`, {
      with: [
        "brand",
        "taxes",
        "client",
        "status",
        "contract",
        "payments",
        "products",
        "promotions",
        "client.tags",
        "products.tags",
        "taxes.tax_tag_data",
        "custom_fields.field",
        "affiliate_commissions",
        "products.product.image",
        "account.affiliate_referral.affiliate_account.account.client"
      ].join(","),
      with_staged_imports: 1
    }),
    queryKey: [...queryKey, { invoiceId }],
    withAccessToken: true,
    guard: async () =>
      new Promise((resolve, reject) => {
        if (meta.value.isAuthenticated && !!user.value?.id) {
          resolve(true);
        } else {
          reject(new NotAuthenticatedError());
        }
      }),
    // --- options
    retry: 1,
    select: parseInvoice,
    staleTime: useTime()?.DAY
  });
}

export default {
  queryKey,
  //--- queries
  loadInvoice
};
