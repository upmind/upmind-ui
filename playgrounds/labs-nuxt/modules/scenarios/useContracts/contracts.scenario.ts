// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContracts/contracts.scenario
 * @description A client's own contracts — the client×self collection
 * (`useContracts`) as the shared list, pagination only (R32), its rows opening
 * into the self-drawn manager page (`useContract`). The sibling of the MANAGER
 * page, which reads one contract whole and drives its payment-method form.
 *
 * No `useMutate`: the collection has no generic write — see
 * `contracts.presentation.ts`'s module docblock. No `useDetail` either,
 * DELIBERATELY: the manager addresses its contract through
 * `.for('contract', id)` (`CONTRACT_SCOPE_MATRIX`), and the runtime's generic
 * detail fetch (`useModulePort.ts`) only ever calls `scoped.withId(scope.id)`,
 * so binding `useContract` here would boot it with no contract at all. The
 * detail overlay draws the clicked row's OWN data instead.
 *
 * The FILE is named for the module it declares and the DIRECTORY is the url
 * segment and the route name (`/useContracts`). No scope is declared: the page
 * boots as self with no context, and `CONTRACTS_SCOPE_MATRIX`
 * (`contract.types.ts`) serves only `client`, reached through the url's own
 * `/as/client` segment.
 */

import { useContracts } from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./contracts.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const CONTRACTS_SCENARIO = "contracts";

export default {
  key: CONTRACTS_SCENARIO,
  useList: useContracts,
  persistCriteria: true,
  // The MODULE whose committed `.feature` and step catalog this page plays —
  // the same module the manager page tracks, because the catalog is keyed by
  // module and serves both keys. This page leaves the manager's and its meta
  // scenarios out: the payment-method form, the node flags and the member
  // proofs are the manager page's own.
  tracks: {
    module: "contract",
    without: ["@manager", "@meta"]
  },
  presentation: {
    icon: "receipt",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
