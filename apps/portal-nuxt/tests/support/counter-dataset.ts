// -----------------------------------------------------------------------------
/**
 * @module tests/support/counter-dataset
 * @description The gate counter-fixture. The app now ships two datasets —
 * hostgrid with legacy's gates ON, `hostgrid-minimal` with every one of them
 * OFF — and this is the third: hostgrid's own rows with the gates flipped and
 * the child-account list padded to three pages, which neither shipped dataset
 * carries. Nothing is invented, so a seed change reaches this fixture too.
 *
 * A gate branch proven only by the brand that happens to ship is not proven —
 * the assertion just reads the seed back. Both branches keep a dataset here.
 */

import { assign } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { fillerChildAccount, padTo } from "~/portal/mock/hostgrid.filler";
// -----------------------------------------------------------------------------

/**
 * The shipped seed with legacy's gates OFF and a child account present — the
 * mirror of hostgrid on every gated fact. A fresh clone per call: the seed
 * itself is deep-frozen, and a caller may mutate what it gets back.
 */
export function gatesOffDataset(): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(dataset, {
    features: {
      CLIENT_NOTES_AND_SECRETS_ENABLED: false,
      SUPPORT_PIN_ENABLED: false,
      DISABLE_SUPPORT_SYSTEM: true,
      DEFAULT_CLIENT_HOMEPAGE: "/",
      UPMIND_BRANDING_ENABLED: false,
      UPMIND_AFFILIATES_ENABLED: false,
      showStore: false,
      hideOneTimePurchases: true
    },
    vault: [],
    affiliate: null,
    childAccounts: padTo([], fillerChildAccount)
  });
}

/**
 * The shipped seed shrunk to a handful of rows and ONE non-default card — the
 * branches a three-page seed can never show: a pager that hides itself, and
 * the last payment method, which no removal may strand.
 */
export function sparseDataset(): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(dataset, {
    invoices: dataset.invoices.slice(0, 3),
    orders: dataset.orders.slice(0, 3),
    tickets: dataset.tickets.slice(0, 3),
    products: dataset.products.slice(0, 3),
    // Index 0 is the default card; this leaves the one that CAN be removed.
    paymentMethods: dataset.paymentMethods.slice(1, 2)
  });
}
