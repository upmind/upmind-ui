// -----------------------------------------------------------------------------
/**
 * @module affiliate/__tests__/affiliate.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * labs page stories of `affiliate.feature` use. Engine-free by construction: it
 * imports the harness's `defineSteps`, `World` and actor vocabulary and the scenario
 * recordings, and nothing of the module's own source, so the same catalog
 * re-registers against the labs page and the headless replay alike.
 *
 * Every value a step fires or expects is read off the scenario's OWN recording
 * (`scenarios/<scenario>/<NN>/*.json`), never copied: each
 * `pnpm fixtures:generate affiliate` run records new ids.
 *
 * ## The keys this catalog boots
 * Each panel of the labs affiliate area is addressed by the harness as
 * `<area>.<panel>` (`affiliate.scenario.ts`); the guest page by its own key.
 * The link editor is a second key beside the links collection (ADR 035
 * Amendment 1): the area binds no harness key for a panel's editor, so the
 * three link-editor tracks replay here and not on the page.
 */

import { SCOPE_ACTOR, defineSteps } from "@upmind-automation/scenario-harness";
import deleteLinkRecording from "./scenarios/a-client-deletes-one-of-their-referral-links/02/delete-accounts-id-affiliate-links-id.json";
import commissionsBeforeNarrowRecording from "./scenarios/a-client-narrows-their-commission-history-to-commissions-earned-after-a-moment/01/get-accounts-id-affiliate-pending-commissions-with-staged-imports-1.json";
import commissionsNarrowedRecording from "./scenarios/a-client-narrows-their-commission-history-to-commissions-earned-after-a-moment/02/get-accounts-id-affiliate-pending-commissions-0df33052.json";
import payoutsBeforeNarrowRecording from "./scenarios/a-client-narrows-their-payout-history-to-payouts-made-after-a-moment/01/get-accounts-id-affiliate-payouts-with-staged-imports-1.json";
import payoutsNarrowedRecording from "./scenarios/a-client-narrows-their-payout-history-to-payouts-made-after-a-moment/02/get-accounts-id-affiliate-payouts-filter-created-at-after-2026-09-29-00-00-00-with-staged-imports-1.json";
import linksBeforeNarrowRecording from "./scenarios/a-client-narrows-their-referral-links-to-one-name/01/get-accounts-id-affiliate-links-with-staged-imports-1.json";
import referralsBeforeNarrowRecording from "./scenarios/a-client-narrows-their-referrals-to-those-referred-after-a-moment/01/get-accounts-id-affiliate-referrals.json";
import referralsNarrowedRecording from "./scenarios/a-client-narrows-their-referrals-to-those-referred-after-a-moment/02/get-accounts-id-affiliate-referrals-filter-created-at-after-2026-09-29-18-30-00.json";
import balanceRecording from "./scenarios/a-client-opens-the-overview-tab-and-reads-their-affiliate-account-and-its-stats/01/get-accounts-id-affiliate-balance-with-staged-imports-1.json";
import accountRecording from "./scenarios/a-client-opens-the-overview-tab-and-reads-their-affiliate-account-and-its-stats/01/get-accounts-id-affiliate-with-staged-imports-1.json";
import destinationAccountRecording from "./scenarios/a-client-opens-their-payout-destination-with-the-saved-destination-and-pay-pal-email-chosen/01/get-accounts-id-affiliate-with-staged-imports-1.json";
import destinationsRecording from "./scenarios/a-client-opens-their-payout-destination-with-the-saved-destination-and-pay-pal-email-chosen/01/get-brands-id-affiliate-payout-destination.json";
import emailsRecording from "./scenarios/a-client-opens-their-payout-destination-with-the-saved-destination-and-pay-pal-email-chosen/01/get-clients-id-emails-with-staged-imports-1.json";
import commissionsRecording from "./scenarios/a-client-reads-their-commission-history/01/get-accounts-id-affiliate-pending-commissions-with-staged-imports-1.json";
import payoutsRecording from "./scenarios/a-client-reads-their-payout-history/01/get-accounts-id-affiliate-payouts-with-staged-imports-1.json";
import linksRecording from "./scenarios/a-client-reads-their-referral-links-each-with-its-shareable-referral-url/01/get-accounts-id-affiliate-links-with-staged-imports-1.json";
import linksAccountRecording from "./scenarios/a-client-reads-their-referral-links-each-with-its-shareable-referral-url/01/get-accounts-id-affiliate-with-staged-imports-1.json";
import referralsRecording from "./scenarios/a-client-reads-who-their-referral-links-brought-in/01/get-accounts-id-affiliate-referrals.json";
import renameLinkRecording from "./scenarios/a-client-renames-one-of-their-referral-links/02/put-accounts-id-affiliate-links-id.json";
import commissionsFirstPageRecording from "./scenarios/a-client-turns-to-the-second-page-of-their-commission-history-one-commission-per-page/01/get-accounts-id-affiliate-pending-commissions-with-staged-imports-1.json";
import commissionsSecondPageRecording from "./scenarios/a-client-turns-to-the-second-page-of-their-commission-history-one-commission-per-page/02/get-accounts-id-affiliate-pending-commissions-with-staged-imports-1.json";
import linksFirstPageRecording from "./scenarios/a-client-turns-to-the-second-page-of-their-referral-links-one-link-per-page/01/get-accounts-id-affiliate-links-with-staged-imports-1.json";
import linksSecondPageRecording from "./scenarios/a-client-turns-to-the-second-page-of-their-referral-links-one-link-per-page/02/get-accounts-id-affiliate-links-with-staged-imports-1.json";
import referralsFirstPageRecording from "./scenarios/a-client-turns-to-the-second-page-of-their-referrals-one-referral-per-page/01/get-accounts-id-affiliate-referrals.json";
import referralsSecondPageRecording from "./scenarios/a-client-turns-to-the-second-page-of-their-referrals-one-referral-per-page/02/get-accounts-id-affiliate-referrals.json";
import withdrawalBalanceRecording from "./scenarios/a-client-with-a-payable-balance-is-offered-a-withdrawal-on-the-commissions-tab/01/get-accounts-id-affiliate-balance-with-staged-imports-1.json";
import {
  differenceBy,
  find,
  findLast,
  first,
  includes,
  map,
  reject,
  split,
  values
} from "lodash-es";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The labs area's panels, each addressed `<area>.<panel>` by the harness. */
export const AFFILIATE_ACCOUNT_SCENARIO = "affiliate.account";
export const AFFILIATE_LINKS_SCENARIO = "affiliate.links";
export const AFFILIATE_REFERRALS_SCENARIO = "affiliate.referrals";
export const AFFILIATE_WITHDRAWAL_SCENARIO = "affiliate.withdrawal";
export const AFFILIATE_COMMISSIONS_SCENARIO = "affiliate.commissions";
export const AFFILIATE_PAYOUT_DESTINATION_SCENARIO =
  "affiliate.payout_destination";
export const AFFILIATE_PAYOUTS_SCENARIO = "affiliate.payouts";

/** The link editor, booted beside the links collection. */
export const AFFILIATE_LINK_EDITOR_SCENARIO = "affiliate.link_editor";

/** The guest's own link-visit page. */
export const AFFILIATE_LINK_VISIT_SCENARIO = "affiliate_link_visit";

/**
 * The action ids these steps drive, exported as the gate's `coveredActionIds`
 * so the covered set and the calls that cover it cannot drift.
 */
export const AFFILIATE_COVERED_ACTIONS = {
  isReady: "isReady",
  refresh: "refresh",
  setCriteria: "setCriteria",
  remove: "remove",
  input: "input",
  update: "update",
  visit: "visit"
} as const;

export const coveredActionIds: readonly string[] = values(
  AFFILIATE_COVERED_ACTIONS
);

// -----------------------------------------------------------------------------

type Recording<T> = {
  request: { path: string };
  response: { body: { data: T } };
};

type Row = { id: string; created_at?: string; createdAt?: string };
type LinkRow = Row & { name: string; hash: string };

const rowsOf = <T>(recording: unknown): T[] =>
  (recording as Recording<T[]>).response.body.data;

const dataOf = <T>(recording: unknown): T =>
  (recording as Recording<T>).response.body.data;

const RECORD_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The record id a recorded request addressed — the last id segment of its path. */
const recordedId = (recording: unknown): string =>
  findLast(
    split(
      first(split((recording as Recording<unknown>).request.path, "?")),
      "/"
    ),
    segment => RECORD_ID.test(segment)
  ) ?? "";

/**
 * A value of `row` that appears nowhere in `listed` — what proves the row is
 * gone from a list that may still carry its id inside a nested relation.
 */
function markerAbsentFrom(row: Row, listed: unknown): string {
  const text = JSON.stringify(listed);
  const marker = find(
    [row.id, row.created_at, row.createdAt],
    value => !!value && !includes(text, value)
  );
  if (!marker)
    throw new Error(
      `No value of the recorded row ${row.id} is absent from the list that should drop it.`
    );
  return marker;
}

type AccountData = {
  created_at: string;
  link_visit_count: number;
  referral_count: number;
  account: {
    affiliate_payout_destination_id: string;
    affiliate_payout_paypal_email_id: string;
    brand: { oauth_clients: { origin: string; default: boolean }[] };
  };
};

type AmountFormatted = { ALL: { amount_formatted: string } };
type BalanceData = {
  balance: AmountFormatted;
  pending_balance: AmountFormatted;
  withdrawn_balance: AmountFormatted;
};

const ACCOUNT = dataOf<AccountData>(accountRecording);
const BALANCES = dataOf<BalanceData>(balanceRecording);

/** The shareable link as the legacy client area builds it: `{default origin}/aff/{hash}`. */
const referralUrl = (hash: string): string =>
  `${
    find(
      dataOf<AccountData>(linksAccountRecording).account.brand.oauth_clients,
      "default"
    )?.origin
  }/aff/${hash}`;

const RECORDED = {
  renamedLinkId: recordedId(renameLinkRecording),
  deletedLinkId: recordedId(deleteLinkRecording)
} as const;

// -----------------------------------------------------------------------------

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

/** Re-runs a world expectation until the cell settles on it. */
async function settles(assertion: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt < SETTLE_ATTEMPTS; attempt++) {
    const err = await assertion()
      .then(() => undefined)
      .catch((e: unknown) => e);
    if (!err) return;
    await new Promise(resolve => setTimeout(resolve, SETTLE_INTERVAL_MS));
  }
  return assertion();
}

/** Boots one panel as the signed-in client and waits for its first read. */
async function openPanel(world: World, key: string): Promise<void> {
  await world.boot(key, { actor: SCOPE_ACTOR.CLIENT });
  await world.fire(AFFILIATE_COVERED_ACTIONS.isReady, undefined, key);
  await settles(() =>
    world.expectMeta({ isAvailable: true, hasError: false }, key)
  );
}

/** Opens the link editor, fresh or on one link, and waits until it can save. */
async function openLinkEditor(world: World, id?: string): Promise<void> {
  await world.boot(AFFILIATE_LINK_EDITOR_SCENARIO, {
    actor: SCOPE_ACTOR.CLIENT,
    ...(id ? { id } : {})
  });
  await world.fire(
    AFFILIATE_COVERED_ACTIONS.isReady,
    undefined,
    AFFILIATE_LINK_EDITOR_SCENARIO
  );
  await settles(() =>
    world.expectMeta(
      { isAvailable: true, isNew: !id },
      AFFILIATE_LINK_EDITOR_SCENARIO
    )
  );
}

/** Names a link and saves it through the editor. */
async function saveLinkName(world: World, name: string): Promise<void> {
  await world.fire(
    AFFILIATE_COVERED_ACTIONS.input,
    { name },
    AFFILIATE_LINK_EDITOR_SCENARIO
  );
  await world.fire(
    AFFILIATE_COVERED_ACTIONS.update,
    undefined,
    AFFILIATE_LINK_EDITOR_SCENARIO
  );
  await settles(() =>
    world.expectMeta({ hasError: false }, AFFILIATE_LINK_EDITOR_SCENARIO)
  );
}

const narrowCreatedAfter = (world: World, key: string, after: string) =>
  world.fire(
    AFFILIATE_COVERED_ACTIONS.setCriteria,
    { filters: { created_at: { after } } },
    key
  );

const sortBy = (world: World, key: string, field: string, dir: string) =>
  world.fire(
    AFFILIATE_COVERED_ACTIONS.setCriteria,
    { sort: [{ field, dir }] },
    key
  );

const secondPageOfOne = (world: World, key: string) =>
  world.fire(
    AFFILIATE_COVERED_ACTIONS.setCriteria,
    { pagination: { limit: 1, offset: 1 } },
    key
  );

/** Every recorded row is listed by its own id. */
const listsEvery = (world: World, key: string, rows: Row[]) =>
  settles(() =>
    world.expectContext!({ data: map(rows, ({ id }) => ({ id })) }, key)
  );

/**
 * The list holds exactly the narrowed recording's rows: each of them is
 * listed, and each row of the list before narrowing that the narrowed
 * recording does not hold is gone.
 */
async function listsOnly(
  world: World,
  key: string,
  narrowed: Row[],
  before: Row[]
): Promise<void> {
  await settles(() => world.expectMeta({ isFiltered: true }, key));
  await listsEvery(world, key, narrowed);
  for (const dropped of differenceBy(before, narrowed, "id"))
    await settles(() =>
      world.expectAbsent!(markerAbsentFrom(dropped, narrowed), key)
    );
}

/** The second page holds its own recorded row, and the first page's lead row is gone. */
async function showsSecondPage(
  world: World,
  key: string,
  firstPage: Row[],
  secondPage: Row[]
): Promise<void> {
  await settles(() => world.expectMeta({ hasPrevPage: true }, key));
  await listsEvery(world, key, secondPage);
  const lead = first(firstPage) as Row;
  await settles(() =>
    world.expectAbsent!(markerAbsentFrom(lead, secondPage), key)
  );
}

const orderedBy = (world: World, key: string, field: string, dir: string) =>
  settles(() =>
    world.expectContext!({ query: { sort: [{ field, dir }] } }, key)
  );

// -----------------------------------------------------------------------------

export const affiliateSteps = defineSteps(({ Given, When, Then }) => {
  // --- the account (Overview) and the withdrawal (Commissions) ------------

  Given("the client's affiliate account panel is open", world =>
    openPanel(world, AFFILIATE_ACCOUNT_SCENARIO)
  );

  When("the client reloads their affiliate account", world =>
    world.fire(
      AFFILIATE_COVERED_ACTIONS.refresh,
      undefined,
      AFFILIATE_ACCOUNT_SCENARIO
    )
  );

  Then(
    "the client reads their enrolled affiliate account with its visits, referrals and balances",
    async world => {
      await settles(() =>
        world.expectMeta(
          {
            isEnrolled: true,
            isDisabled: false,
            hasError: false,
            linkVisitCount: ACCOUNT.link_visit_count,
            referralCount: ACCOUNT.referral_count
          },
          AFFILIATE_ACCOUNT_SCENARIO
        )
      );
      await settles(() =>
        world.expectContext!(
          {
            data: { created_at: ACCOUNT.created_at },
            balances: {
              balance: {
                ALL: { amount_formatted: BALANCES.balance.ALL.amount_formatted }
              },
              pending_balance: {
                ALL: {
                  amount_formatted:
                    BALANCES.pending_balance.ALL.amount_formatted
                }
              },
              withdrawn_balance: {
                ALL: {
                  amount_formatted:
                    BALANCES.withdrawn_balance.ALL.amount_formatted
                }
              }
            }
          },
          AFFILIATE_ACCOUNT_SCENARIO
        )
      );
    }
  );

  Given("the client's withdrawal panel is open", world =>
    openPanel(world, AFFILIATE_WITHDRAWAL_SCENARIO)
  );

  Then(
    "the client is offered a withdrawal of their available balance",
    async world => {
      await settles(() =>
        world.expectMeta(
          { canWithdraw: true, hasPayableCommissions: true },
          AFFILIATE_WITHDRAWAL_SCENARIO
        )
      );
      await settles(() =>
        world.expectContext!(
          {
            balances: {
              balance: {
                ALL: {
                  amount_formatted: dataOf<BalanceData>(
                    withdrawalBalanceRecording
                  ).balance.ALL.amount_formatted
                }
              }
            }
          },
          AFFILIATE_WITHDRAWAL_SCENARIO
        )
      );
    }
  );

  // --- the referral links (Overview) --------------------------------------

  Given("the client's referral links panel is open", world =>
    openPanel(world, AFFILIATE_LINKS_SCENARIO)
  );

  Then(
    "the client reads each of their referral links with its shareable referral URL",
    world =>
      settles(() =>
        world.expectContext!(
          {
            data: map(rowsOf<LinkRow>(linksRecording), ({ id, hash }) => ({
              id,
              referral_url: referralUrl(hash)
            }))
          },
          AFFILIATE_LINKS_SCENARIO
        )
      )
  );

  When(
    "the client narrows their referral links to the name {string}",
    (world, name) =>
      world.fire(
        AFFILIATE_COVERED_ACTIONS.setCriteria,
        { filters: { name: { eq: name } } },
        AFFILIATE_LINKS_SCENARIO
      )
  );

  Then(
    "the referral link named {string} is the only one listed",
    async (world, name) => {
      await settles(() =>
        world.expectMeta({ isFiltered: true }, AFFILIATE_LINKS_SCENARIO)
      );
      await settles(() =>
        world.expectContext!({ data: [{ name }] }, AFFILIATE_LINKS_SCENARIO)
      );
      for (const other of reject(
        rowsOf<LinkRow>(linksBeforeNarrowRecording),
        row => row.name === name
      ))
        await settles(() =>
          world.expectAbsent!(other.name, AFFILIATE_LINKS_SCENARIO)
        );
    }
  );

  When(
    "the client sorts their referral links by visits, most visited first",
    world => sortBy(world, AFFILIATE_LINKS_SCENARIO, "visit_count", "desc")
  );

  Then(
    "the client's referral links are ordered by visits, most visited first",
    world => orderedBy(world, AFFILIATE_LINKS_SCENARIO, "visit_count", "desc")
  );

  When(
    "the client turns to the second page of their referral links, one per page",
    world => secondPageOfOne(world, AFFILIATE_LINKS_SCENARIO)
  );

  Then(
    "the second page's referral link is listed in place of the first page's",
    world =>
      showsSecondPage(
        world,
        AFFILIATE_LINKS_SCENARIO,
        rowsOf<LinkRow>(linksFirstPageRecording),
        rowsOf<LinkRow>(linksSecondPageRecording)
      )
  );

  When("the client creates the referral link {string}", async (world, name) => {
    await openLinkEditor(world);
    await saveLinkName(world, String(name));
  });

  When(
    "the client renames their referral link {string} to {string}",
    async (world, _current, renamed) => {
      await openLinkEditor(world, RECORDED.renamedLinkId);
      await saveLinkName(world, String(renamed));
    }
  );

  When("the client deletes their referral link {string}", world =>
    world.fire(
      AFFILIATE_COVERED_ACTIONS.remove,
      RECORDED.deletedLinkId,
      AFFILIATE_LINKS_SCENARIO
    )
  );

  Then(
    "the referral link {string} is among the client's referral links",
    (world, name) =>
      settles(() =>
        world.expectContext!({ data: [{ name }] }, AFFILIATE_LINKS_SCENARIO)
      )
  );

  Then(
    "the referral link {string} is no longer among the client's referral links",
    (world, name) =>
      settles(() => world.expectAbsent!(String(name), AFFILIATE_LINKS_SCENARIO))
  );

  // --- the referrals (Overview) -------------------------------------------

  Given("the client's referrals panel is open", world =>
    openPanel(world, AFFILIATE_REFERRALS_SCENARIO)
  );

  Then("the client reads each of their referrals", world =>
    listsEvery(
      world,
      AFFILIATE_REFERRALS_SCENARIO,
      rowsOf<Row>(referralsRecording)
    )
  );

  When(
    "the client narrows their referrals to those created after {string}",
    (world, after) =>
      narrowCreatedAfter(world, AFFILIATE_REFERRALS_SCENARIO, String(after))
  );

  Then(
    "only the client's referrals created after that moment are listed",
    world =>
      listsOnly(
        world,
        AFFILIATE_REFERRALS_SCENARIO,
        rowsOf<Row>(referralsNarrowedRecording),
        rowsOf<Row>(referralsBeforeNarrowRecording)
      )
  );

  When("the client sorts their referrals oldest first", world =>
    sortBy(world, AFFILIATE_REFERRALS_SCENARIO, "created_at", "asc")
  );

  Then("the client's referrals are ordered oldest first", world =>
    orderedBy(world, AFFILIATE_REFERRALS_SCENARIO, "created_at", "asc")
  );

  When(
    "the client turns to the second page of their referrals, one per page",
    world => secondPageOfOne(world, AFFILIATE_REFERRALS_SCENARIO)
  );

  Then(
    "the second page's referral is listed in place of the first page's",
    world =>
      showsSecondPage(
        world,
        AFFILIATE_REFERRALS_SCENARIO,
        rowsOf<Row>(referralsFirstPageRecording),
        rowsOf<Row>(referralsSecondPageRecording)
      )
  );

  // --- the commission history (Commissions) --------------------------------

  Given("the client's commission history panel is open", world =>
    openPanel(world, AFFILIATE_COMMISSIONS_SCENARIO)
  );

  Then("the client reads each of their commissions", world =>
    listsEvery(
      world,
      AFFILIATE_COMMISSIONS_SCENARIO,
      rowsOf<Row>(commissionsRecording)
    )
  );

  When(
    "the client narrows their commission history to those created after {string}",
    (world, after) =>
      narrowCreatedAfter(world, AFFILIATE_COMMISSIONS_SCENARIO, String(after))
  );

  Then(
    "only the client's commissions created after that moment are listed",
    world =>
      listsOnly(
        world,
        AFFILIATE_COMMISSIONS_SCENARIO,
        rowsOf<Row>(commissionsNarrowedRecording),
        rowsOf<Row>(commissionsBeforeNarrowRecording)
      )
  );

  When("the client sorts their commission history oldest first", world =>
    sortBy(world, AFFILIATE_COMMISSIONS_SCENARIO, "created_at", "asc")
  );

  Then("the client's commission history is ordered oldest first", world =>
    orderedBy(world, AFFILIATE_COMMISSIONS_SCENARIO, "created_at", "asc")
  );

  When(
    "the client turns to the second page of their commission history, one per page",
    world => secondPageOfOne(world, AFFILIATE_COMMISSIONS_SCENARIO)
  );

  Then(
    "the second page's commission is listed in place of the first page's",
    world =>
      showsSecondPage(
        world,
        AFFILIATE_COMMISSIONS_SCENARIO,
        rowsOf<Row>(commissionsFirstPageRecording),
        rowsOf<Row>(commissionsSecondPageRecording)
      )
  );

  // --- the payout destination and the payout history (Payouts) -------------

  Given("the client's payout destination panel is open", async world => {
    await world.boot(AFFILIATE_PAYOUT_DESTINATION_SCENARIO, {
      actor: SCOPE_ACTOR.CLIENT
    });
    await world.fire(
      AFFILIATE_COVERED_ACTIONS.isReady,
      undefined,
      AFFILIATE_PAYOUT_DESTINATION_SCENARIO
    );
    await settles(() =>
      world.expectMeta(
        { isAvailable: true, hasErrors: false },
        AFFILIATE_PAYOUT_DESTINATION_SCENARIO
      )
    );
  });

  Then(
    "the payout destination editor holds the saved destination and PayPal email, chosen from the brand's destinations and the client's emails",
    async world => {
      const { account } = dataOf<AccountData>(destinationAccountRecording);
      await settles(() =>
        world.expectMeta(
          { isPaypal: true, isDirty: false },
          AFFILIATE_PAYOUT_DESTINATION_SCENARIO
        )
      );
      await settles(() =>
        world.expectContext!(
          {
            model: {
              payoutDestinationId: account.affiliate_payout_destination_id,
              paypalEmailId: account.affiliate_payout_paypal_email_id
            },
            destinations: map(rowsOf<Row>(destinationsRecording), ({ id }) => ({
              id
            })),
            emails: map(rowsOf<Row>(emailsRecording), ({ id }) => ({ id }))
          },
          AFFILIATE_PAYOUT_DESTINATION_SCENARIO
        )
      );
    }
  );

  Given("the client's payout history panel is open", world =>
    openPanel(world, AFFILIATE_PAYOUTS_SCENARIO)
  );

  Then("the client reads each of their payouts", world =>
    listsEvery(world, AFFILIATE_PAYOUTS_SCENARIO, rowsOf<Row>(payoutsRecording))
  );

  When(
    "the client narrows their payout history to those created after {string}",
    (world, after) =>
      narrowCreatedAfter(world, AFFILIATE_PAYOUTS_SCENARIO, String(after))
  );

  Then(
    "only the client's payouts created after that moment are listed",
    world =>
      listsOnly(
        world,
        AFFILIATE_PAYOUTS_SCENARIO,
        rowsOf<Row>(payoutsNarrowedRecording),
        rowsOf<Row>(payoutsBeforeNarrowRecording)
      )
  );

  When(
    "the client sorts their payout history by amount, largest first",
    world => sortBy(world, AFFILIATE_PAYOUTS_SCENARIO, "amount", "desc")
  );

  Then(
    "the client's payout history is ordered by amount, largest first",
    world => orderedBy(world, AFFILIATE_PAYOUTS_SCENARIO, "amount", "desc")
  );

  // --- the guest's link visit ---------------------------------------------

  Given("a visitor has arrived on an affiliate referral link", world =>
    world.boot(AFFILIATE_LINK_VISIT_SCENARIO, { actor: SCOPE_ACTOR.GUEST })
  );

  When("the visitor's referral link visit is sent", world =>
    world.fire(
      AFFILIATE_COVERED_ACTIONS.visit,
      undefined,
      AFFILIATE_LINK_VISIT_SCENARIO
    )
  );

  Then(
    "the visit is recorded and the visitor has a destination to be sent on to",
    world =>
      settles(() =>
        world.expectMeta(
          { hasVisited: true, hasError: false, isLoading: false },
          AFFILIATE_LINK_VISIT_SCENARIO
        )
      )
  );
});

export default affiliateSteps;
