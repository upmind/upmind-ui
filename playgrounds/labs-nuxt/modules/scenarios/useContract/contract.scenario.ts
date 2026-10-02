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
 * The shared playground draws it as a RECORD: `useManage` plus the declared
 * `presentation.record` (`contract.presentation.ts`) route it to the record
 * surface, which builds every field, action and form from that declaration
 * against the live manager.
 *
 * The DIRECTORY is the url segment and route name (`/useContract`). The
 * contract is addressed by the `id` route param declared below —
 * `/useContract/<id>` — and the playground boots
 * `.as(ScopeActorTypes.CLIENT).withId(id)`, the single-record read form
 * (templates/SINGLE-READ.md; `CONTRACT_SCOPE_MATRIX` refuses every actor a
 * context). OPTIONAL, because the bare url is the empty state — with no id
 * the page offers the declared picker — the collection's own contracts picker
 * (`useContracts().useContext().schemas.contractPicker`) — and a direct id
 * input.
 *
 * `useManage` is what the harness builds the boot thunk for its key from, and
 * `tracks` names the module whose committed `.feature` and step catalog this
 * page plays; the listing's `@collection` scenarios are the list page's.
 */

import { useContract } from "@upmind-automation/headless";
import { contractRecord } from "./contract.presentation";
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
    icon: "receipt",
    record: contractRecord
  }
} satisfies ScenarioDeclaration;
