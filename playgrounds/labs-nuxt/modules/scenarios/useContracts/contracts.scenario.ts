// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContracts/contracts.scenario
 * @description A client's own contracts — the client×self collection
 * (`useContracts`) as the shared list, filterable, sortable and paged (R38,
 * supersedes the withdrawn R32 pagination-only shape), its rows opening into
 * the self-drawn manager page (`useContract`). The sibling of the MANAGER
 * page, which reads one contract whole and drives its payment-method form.
 *
 * No `useMutate`: the collection has no generic write — see
 * `contracts.presentation.ts`'s module docblock. `useDetail: useContract`
 * lets `view` fetch one contract's full record; the manager publishes it as
 * `contract` rather than `data` (`useContract.context.ts`), so the detail
 * presentation declares `siblings: ["contract"]` to reach it.
 *
 * The FILE is named for the module it declares and the DIRECTORY is the url
 * segment and the route name (`/useContracts`). No scope is declared: the page
 * boots as self with no context, and `CONTRACTS_SCOPE_MATRIX`
 * (`contract.types.ts`) serves only `client`, reached through the url's own
 * `/as/client` segment.
 */

import { useContract, useContracts } from "@upmind-automation/headless";
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
  // The row's `view` fetches ONE contract by record id through the generic
  // single-read overlay — the manager keyed by id, never by a scope context
  // (templates/SINGLE-READ.md).
  useDetail: useContract,
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
