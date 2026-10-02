// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientAffiliate/affiliate.scenario
 * @description The client×self affiliate AREA — ONE page, three tabs, the way
 * the legacy client area draws it (`R-PAGES`): Overview (the account's stats,
 * its links and its referrals), Commissions (the withdrawal and the commission
 * history) and Payouts (the destination editor and the payout history). Each
 * tab stacks the panels it names; each panel is the existing surface for ONE
 * binding, booted under the harness key `<area>.<panel>`.
 *
 * The DIRECTORY is the url segment and the route name (`/useClientAffiliate`),
 * so nothing here declares a route. Nor a scope: the page boots as self, which
 * in a signed-in session is the client's own account. Both scope matrices are
 * all-`never` (`affiliate.types.ts`), so the acting-for bar owes nothing, and
 * the account comes from the session — never from a url id (`R-NO-SWITCH`).
 *
 * The link editor opens through `.withId(<row id>)` (`R-EDIT-HANDOFF`), never
 * `.for(type, id)`: a link is a leaf record, not an ADR-001 context.
 *
 * Both single-record panels over `useClientAffiliate` (the account and the
 * withdrawal) address the session's own record, so they declare no route param
 * and boot at the actor alone; the two share one cell and one set of reads.
 *
 * The guest's affiliate-link visit is its own small page
 * (`useAffiliateLinkVisit`).
 */

import {
  useAffiliateCommissions,
  useAffiliateLinkManager,
  useAffiliateLinks,
  useAffiliatePayoutDestinationManager,
  useAffiliatePayouts,
  useAffiliateReferrals,
  useClientAffiliate
} from "@upmind-automation/headless";
import {
  accountRecord,
  commissionsCard,
  commissionsTable,
  linksActions,
  linksCard,
  linksTable,
  payoutsCard,
  payoutsTable,
  referralsCard,
  referralsTable,
  refreshOnlyActions,
  withdrawalRecord
} from "./affiliate.presentation";
import { without } from "lodash-es";
import type {
  ScenarioDeclaration,
  ScenarioTracks
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This area's key — the identity a `.feature` and the BDD world name it by. */
export const AFFILIATE_SCENARIO = "affiliate";

/** The module whose committed `.feature` and step catalog every panel plays. */
const AFFILIATE_MODULE = "affiliate";

/**
 * The tag each panel's scenarios carry in the module's one `.feature`. A panel
 * plays its own and leaves the rest out, so no panel offers a control it
 * cannot honestly drive (`tracks.without`, the `useTickets` precedent).
 */
const PANEL_TAGS = [
  "@account",
  "@links",
  "@referrals",
  "@withdrawal",
  "@commissions",
  "@payout-destination",
  "@payouts",
  "@visit"
];

const tracksOf = (own: string): ScenarioTracks => ({
  module: AFFILIATE_MODULE,
  without: without(PANEL_TAGS, own)
});

/** What the link editor's save says either way. */
const LINK_SAVE_FEEDBACK = {
  success: "labs.affiliate_link_saved",
  failure: "labs.affiliate_link_save_failed"
};

export default {
  key: AFFILIATE_SCENARIO,
  tracks: AFFILIATE_MODULE,
  presentation: { icon: "share-07" },
  tabs: [
    {
      key: "overview",
      i18n: "labs.affiliate_tab_overview",
      icon: "home-01",
      panels: [
        {
          key: "account",
          useManage: useClientAffiliate,
          tracks: tracksOf("@account"),
          presentation: { icon: "share-07", record: accountRecord }
        },
        {
          key: "links",
          i18n: "labs.affiliate_links",
          useList: useAffiliateLinks,
          useMutate: useAffiliateLinkManager,
          persistCriteria: true,
          // Both halves of the editor's job are the SAME editor: the record it
          // opens on decides whether its save creates or updates, so `add`
          // names no record and `edit` points at the row's own id.
          handoff: {
            add: { feedback: LINK_SAVE_FEEDBACK },
            edit: { record: { from: "/id" }, feedback: LINK_SAVE_FEEDBACK }
          },
          tracks: tracksOf("@links"),
          presentation: {
            icon: "share-07",
            table: linksTable,
            card: linksCard,
            actions: linksActions
          }
        },
        {
          key: "referrals",
          i18n: "labs.affiliate_referrals",
          useList: useAffiliateReferrals,
          persistCriteria: true,
          tracks: tracksOf("@referrals"),
          presentation: {
            icon: "user-plus-01",
            table: referralsTable,
            card: referralsCard,
            actions: refreshOnlyActions
          }
        }
      ]
    },
    {
      key: "commissions",
      i18n: "labs.affiliate_tab_commissions",
      icon: "wallet-01",
      panels: [
        {
          key: "withdrawal",
          useManage: useClientAffiliate,
          tracks: tracksOf("@withdrawal"),
          presentation: { icon: "wallet-01", record: withdrawalRecord }
        },
        {
          key: "commissions",
          i18n: "labs.affiliate_commission_history",
          useList: useAffiliateCommissions,
          persistCriteria: true,
          tracks: tracksOf("@commissions"),
          presentation: {
            icon: "wallet-01",
            table: commissionsTable,
            card: commissionsCard,
            actions: refreshOnlyActions
          }
        }
      ]
    },
    {
      key: "payouts",
      i18n: "labs.affiliate_tab_payouts",
      icon: "credit-card-01",
      panels: [
        {
          key: "payout_destination",
          i18n: "labs.affiliate_payout_destination",
          useMutate: useAffiliatePayoutDestinationManager,
          tracks: tracksOf("@payout-destination"),
          presentation: { icon: "credit-card-01" }
        },
        {
          key: "payouts",
          i18n: "labs.affiliate_payout_history",
          useList: useAffiliatePayouts,
          persistCriteria: true,
          tracks: tracksOf("@payouts"),
          presentation: {
            icon: "receipt",
            table: payoutsTable,
            card: payoutsCard,
            actions: refreshOnlyActions
          }
        }
      ]
    }
  ]
} satisfies ScenarioDeclaration;
