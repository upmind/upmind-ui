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
 * This module DRAWS ITSELF: `contract-product.page.vue` beside this file is
 * the route's component (`../index.ts` — "the module's own page wins"), so
 * the shared `ScenarioPlayground`/`ModuleRenderer` never sees it. What keeps
 * it self-drawn is the WRITE side: both forms open from their OWN context
 * slot (`useContext().cancellation` / `.consolidation`), which no generic
 * mutate surface renders, and the formless writes take no argument the
 * generic action panel could gather blind.
 *
 * The DIRECTORY is the url segment and route name (`/useContractProduct`).
 * The product is addressed by the `id` route param declared below —
 * `/useContractProduct/<id>` — which the registrar turns into a `/:id`
 * segment; the page reads it off the route and boots
 * `.as(ScopeActorTypes.CLIENT).withId(id)` (R11 — enum members, no cast;
 * `CONTRACT_PRODUCT_SCOPE_MATRIX` refuses every actor a `.for()` context, so
 * `.as()` is the only step). OPTIONAL, because the bare url is the empty
 * state — with no id the page draws the collection's own finder
 * (`useContractProducts().useContext().schemas.contractProductPicker`), the
 * pick writing the id the manager boots by (R38 item 2).
 *
 * `useManage` is the opt-in a self-drawn declaration makes so the harness can
 * build a boot thunk for its key, and `tracks` names the module whose
 * committed `.feature` and step catalog this page plays — the same module the
 * COLLECTION page tracks, since `stepCatalogs` is keyed by module and serves
 * both keys. Most scenarios are tagged `@collection`, `@manager`, `@meta` or
 * `@machine`; this page leaves `@collection` out — paging, sorting, filtering
 * and the grouped-counts/categories reads are the listing page's. Four
 * scenarios carry no lane tag (three `@module`, one `@mapping`) and reach
 * both pages.
 */

import { useContractProduct } from "@upmind-automation/headless";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const CONTRACT_PRODUCT_SCENARIO = "contract_product";

export default {
  key: CONTRACT_PRODUCT_SCENARIO,
  // `useList` / `useMutate` stay OMITTED — the module draws itself, and no
  // generic surface can render the two write forms or the formless writes
  // (see docblock). `useManage` is the self-drawn page's own opt-in: it binds
  // the manager for BOOTING only, so `World.boot("contract_product", …)`
  // builds a thunk, and the page keeps drawing every pixel itself.
  useManage: useContractProduct,
  // The product is addressed by a path param — `/useContractProduct/:id` —
  // the same shape `useTicket` uses for its own single record. UUID-shaped,
  // because the scope suffix follows it: without the pattern,
  // `/useContractProduct/as/client` resolves `id = "as"` and the actor is
  // lost.
  params: ["id([0-9a-fA-F-]{36})?"],
  tracks: { module: "contract-product", without: ["@collection"] },
  presentation: {
    icon: "box"
  }
} satisfies ScenarioDeclaration;
