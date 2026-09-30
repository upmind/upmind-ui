// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContractProducts/contract-products.scenario
 * @description A client's own contract products — the client×self collection
 * (`useContractProducts`) as the shared list, its rows opening into the
 * self-drawn manager page (`useContractProduct`). The sibling of the MANAGER
 * page, which reads one product whole but drives none of the collection's
 * filter/sort/page/grouped-counts/categories surface.
 *
 * No `useMutate`: the collection has no generic write — see
 * `contract-products.presentation.ts`'s module docblock. `useDetail:
 * useContractProduct` lets `view` fetch one product's full record; the
 * manager publishes it as `contractProduct` rather than `data`
 * (`useContractProduct.context.ts`), so the detail presentation declares
 * `siblings: ["contractProduct"]` to reach it.
 *
 * The FILE is named for the module it declares and the DIRECTORY is the url
 * segment and the route name (`/useContractProducts`). No scope is declared
 * either: the page boots as self with no context — `CONTRACT_PRODUCTS_SCOPE_MATRIX`
 * (`contract-product.types.ts`) serves only `client`, with one SELECTOR
 * context (`delegated`), and the acting-for bar reaches it through the url's
 * own `/for/delegated` segment with no member listed here (D25).
 */

import {
  useContractProduct,
  useContractProducts
} from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./contract-products.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CONTRACT_PRODUCTS_SCENARIO = "contract_products";

export default {
  key: CONTRACT_PRODUCTS_SCENARIO,
  useList: useContractProducts,
  // The row's `view` fetches ONE product by record id through the generic
  // single-read overlay — the manager keyed by id, never by a scope context
  // (templates/SINGLE-READ.md).
  useDetail: useContractProduct,
  persistCriteria: true,
  // The MODULE whose committed `.feature` and step catalog this page plays —
  // the same module the manager page tracks, because the catalog is keyed by
  // module and serves both keys. Most scenarios are tagged `@collection`,
  // `@manager`, `@meta` or `@machine`; this page leaves the manager's,
  // its meta open-gate outlines and its machine scenarios out — the writes,
  // node flags and form gates are the manager page's own. Four scenarios
  // carry no lane tag (three `@module`, one `@mapping`) and reach both pages.
  tracks: {
    module: "contract-product",
    without: ["@manager", "@meta", "@machine"]
  },
  presentation: {
    icon: "box",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
