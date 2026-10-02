// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContractProduct/contract-product.scenario
 * @description One contract product, MANAGED — the client×self manager
 * (`useContractProduct`) drawn as its own page: the record's node flags, its
 * cancellation form (soft / hard / schedule_future, R33), its consolidation
 * form, the formless writes (withdraw, resume, revoke a scheduled
 * cancellation) and the force handle (`reset`). The sibling of the COLLECTION
 * page (`useContractProducts`), which lists a client's products but drives
 * none of this manager's writes.
 *
 * The shared playground draws it as a RECORD: `useManage` plus the declared
 * `presentation.record` (`contract-product.presentation.ts`) route it to the
 * record surface, which builds every field, write, form and navigation from
 * that declaration against the live manager — both forms open the manager's
 * OWN context slot (`cancellation` / `consolidation`).
 *
 * The DIRECTORY is the url segment and route name (`/useContractProduct`).
 * The product is addressed by the `id` route param declared below —
 * `/useContractProduct/<id>` — which the registrar turns into a `/:id`
 * segment; the playground reads it off the route and boots
 * `.as(ScopeActorTypes.CLIENT).withId(id)` (R11 — enum members, no cast;
 * `CONTRACT_PRODUCT_SCOPE_MATRIX` refuses every actor a `.for()` context, so
 * `.as()` is the only step). OPTIONAL, because the bare url is the empty
 * state — with no id the page draws the declared picker, the collection's own
 * finder (`useContractProducts().useContext().schemas.contractProductPicker`), the
 * pick writing the id the manager boots by (R38 item 2).
 *
 * `useManage` is what the harness builds the boot thunk for its key from, and
 * `tracks` names the module whose committed `.feature` and step catalog this page plays — the same module the
 * COLLECTION page tracks, since `stepCatalogs` is keyed by module and serves
 * both keys. Most scenarios are tagged `@collection`, `@manager`, `@meta` or
 * `@machine`; this page leaves `@collection` out — paging, sorting, filtering
 * and the grouped-counts/categories reads are the listing page's. Four
 * scenarios carry no lane tag (three `@module`, one `@mapping`) and reach
 * both pages.
 */

import { useContractProduct } from "@upmind-automation/headless";
import { contractProductRecord } from "./contract-product.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const CONTRACT_PRODUCT_SCENARIO = "contract_product";

export default {
  key: CONTRACT_PRODUCT_SCENARIO,
  // `useList` / `useMutate` stay OMITTED: the manager draws as a RECORD.
  useManage: useContractProduct,
  // The product is addressed by a path param — `/useContractProduct/:id` —
  // the same shape `useTicket` uses for its own single record. UUID-shaped,
  // because the scope suffix follows it: without the pattern,
  // `/useContractProduct/as/client` resolves `id = "as"` and the actor is
  // lost.
  params: ["id([0-9a-fA-F-]{36})?"],
  tracks: {
    module: "contract-product",
    without: ["@collection", "@migration"]
  },
  presentation: {
    icon: "box",
    record: contractProductRecord
  }
} satisfies ScenarioDeclaration;
