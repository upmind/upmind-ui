// -----------------------------------------------------------------------------
/**
 * @module scenarios/useAffiliateLinkVisit/affiliate-link-visit.scenario
 * @description The guest's affiliate-link visit — the small page beside the
 * client area (`R-GUEST`): the module records the visit, writes (or deletes)
 * the `upm_aff` cookie and resolves the redirect target. Its own page, apart
 * from the area (`R-PAGES`): a guest has no account, so nothing here belongs
 * under the client's tabs.
 *
 * Drawn as a RECORD with no route param: the module addresses nobody's record,
 * so the cell boots at the actor alone and the page draws at once. In a
 * signed-out session SELF is the guest.
 */

import {
  ScopeActorTypes,
  useAffiliateLinkVisit
} from "@upmind-automation/headless";
import { linkVisitRecord } from "./affiliate-link-visit.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const AFFILIATE_LINK_VISIT_SCENARIO = "affiliate_link_visit";

export default {
  key: AFFILIATE_LINK_VISIT_SCENARIO,
  // `useList` / `useMutate` stay OMITTED: the visit draws as a RECORD.
  useManage: useAffiliateLinkVisit,
  // A visit is made BEFORE sign-in: offering the guest is what lets the route
  // guard admit a signed-out visitor instead of sending them to the auth gate.
  actors: [ScopeActorTypes.GUEST],
  tracks: {
    module: "affiliate",
    without: [
      "@account",
      "@links",
      "@referrals",
      "@withdrawal",
      "@commissions",
      "@payout-destination",
      "@payouts"
    ]
  },
  presentation: {
    icon: "link-external-01",
    record: linkVisitRecord
  }
} satisfies ScenarioDeclaration;
