// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContract/contract.scenario
 * @description One contract, MANAGED — the client×self manager
 * (`useContract`) drawn as its own page: the contract, its status and its
 * cancellation request's status, the node flags, the payment-method form and
 * the force handle (`reset`). The sibling of the COLLECTION page
 * (`useContracts`), which pages a client's contracts but drives none of this
 * manager's members.
 *
 * This module DRAWS ITSELF: `contract.page.vue` beside this file is the
 * route's component (`../index.ts` — "the module's own page wins"). What keeps
 * it self-drawn is the WRITE side: the payment-method form opens from its OWN
 * context slot (`useContext().paymentMethod`), which no generic mutate surface
 * renders.
 *
 * The DIRECTORY is the url segment and route name (`/useContract`). The
 * contract is addressed by the `id` route param declared below —
 * `/useContract/<id>` — and the page boots
 * `.as(ScopeActorTypes.CLIENT).for(ContractContextTypes.CONTRACT, id)`:
 * `CONTRACT_SCOPE_MATRIX` names the record as a `contract` context, so the id
 * completes the scope rather than a `.withId()`. OPTIONAL, because the bare url
 * is the empty state — with no id the page offers an id input.
 *
 * `useManage` is the opt-in a self-drawn declaration makes so the harness can
 * build a boot thunk for its key, and `tracks` names the module whose
 * committed `.feature` and step catalog this page plays; the listing's
 * `@collection` scenarios are the list page's.
 */

import { useContract } from "@upmind-automation/headless";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const CONTRACT_SCENARIO = "contract";

export default {
  key: CONTRACT_SCENARIO,
  useManage: useContract,
  // UUID-shaped, because the scope suffix follows it: without the pattern,
  // `/useContract/as/client` resolves `id = "as"` and the actor is lost.
  params: ["id([0-9a-fA-F-]{36})?"],
  tracks: { module: "contract", without: ["@collection"] },
  presentation: {
    icon: "receipt"
  }
} satisfies ScenarioDeclaration;
