// -----------------------------------------------------------------------------
/**
 * @module portal/mock/facades/useMockAffiliate
 * @description The client's affiliate account, managed — the mock stand-in
 * for `useClientAffiliate` and the link half of `useAffiliateLinks`
 * (`contracts/client-affiliate.ts`): joining the programme, the three link
 * verbs, asking for a withdrawal, and choosing where it is sent. The three
 * read-only listings ride the collection generic (`collection-defs.ts`), as
 * the contract puts them on their own instances.
 *
 * The contract declares the links on their OWN composable, so its members are
 * named `create` / `update` / `remove` there; here they keep this facade's
 * existing `…Link` spelling, because one facade carries both surfaces and
 * `remove` already means "revoke the account" on the manager next door.
 */

import { AffiliatePayoutDestinationCode } from "@upmind-automation/types";
import { today } from "../dates";
import { mockMoney } from "../money";
import { MOCK_PAYOUT_STATUS } from "../types";
import {
  defineMockFacade,
  MOCK_RECEIPT_REASON,
  mockId,
  submittedText
} from "./facade";
import { assign, find, map, remove, values } from "lodash-es";
import type { MockActionReceipt } from "./facade";
import type {
  MockAffiliate,
  MockAffiliateLink,
  MockAffiliatePayout
} from "../types";
import type { FormModel } from "@upmind/ui";
// -----------------------------------------------------------------------------

/**
 * The shareable link a new referral link is handed out as. The affiliate's
 * own base link plus the row's id, which is what makes two links countable
 * apart — the redirect is where it LANDS, not what is shared.
 */
function shareableLink(affiliate: MockAffiliate, linkId: string): string {
  return `${affiliate.referralLink}-${linkId}`;
}

/**
 * Where a client who names no destination is paid. Legacy fell back to the
 * brand's own setting; the mock brand settles into account credit, which is
 * the one destination it can honestly complete.
 */
const BRAND_DEFAULT_DESTINATION = AffiliatePayoutDestinationCode.WALLET;

/** The destination the client chose, or nothing where they left it to the brand. */
function chosenDestination(
  model: FormModel
): AffiliatePayoutDestinationCode | undefined {
  const code = submittedText(model, "code");
  return find(values(AffiliatePayoutDestinationCode), entry => entry === code);
}

/**
 * What the chosen destination resolves to. PayPal is the one destination that
 * names an address; every other settles somewhere the client does not name,
 * so it resolves to NOTHING — keeping the address on file would leave a
 * client who moved to account credit still being told they are paid at their
 * old PayPal address.
 */
function destinationDetail(
  model: FormModel,
  code: AffiliatePayoutDestinationCode
): string {
  if (code !== AffiliatePayoutDestinationCode.PAYPAL) return "";
  return submittedText(model, "paypalEmail");
}

export const useMockAffiliate = defineMockFacade(
  (data): MockAffiliate | null => data.affiliate,
  data => {
    function account(): MockAffiliate | null {
      return data.affiliate;
    }

    return {
      /** Joins the programme — legacy's opt-in screen, and its one control. */
      enrol: (): MockActionReceipt<MockAffiliate> | undefined => {
        const subject = account();
        if (subject === null) return undefined;
        if (subject.disabled) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.AFFILIATE_DISABLED,
            entity: subject
          };
        }
        if (subject.enrolled) {
          return {
            ok: false,
            reason: MOCK_RECEIPT_REASON.ALREADY_ENROLLED,
            entity: subject
          };
        }
        assign(subject, { enrolled: true, since: today() });
        return { ok: true, entity: subject };
      },

      /** Mints one referral link — the shareable link is the account's, plus its own id. */
      createLink: (
        model: FormModel
      ): MockActionReceipt<MockAffiliateLink> | undefined => {
        const subject = account();
        if (subject === null) return undefined;
        const redirectUrl = submittedText(model, "redirectUrl");
        const linkId = mockId("lnk", map(subject.links, "id"));
        const created: MockAffiliateLink = {
          id: linkId,
          name: submittedText(model, "name"),
          url: shareableLink(subject, linkId),
          redirectUrl,
          clicks: 0,
          signups: 0,
          createdAt: today()
        };
        subject.links.push(created);
        return { ok: true, entity: created };
      },

      /** Renames one, or re-points it; what it has already brought in stays. */
      updateLink: (
        linkId: string,
        model: FormModel
      ): MockActionReceipt<MockAffiliateLink> | undefined => {
        const subject = account();
        if (subject === null) return undefined;
        const link = find(subject.links, { id: linkId });
        if (link === undefined) return undefined;
        const redirectUrl = submittedText(model, "redirectUrl");
        assign(link, { name: submittedText(model, "name"), redirectUrl });
        return { ok: true, entity: link };
      },

      /**
       * Asks for the cleared balance to be paid out. The balance is EMPTIED
       * into a pending payout: the money is spoken for the moment it is asked
       * for, and what has actually been paid is `withdrawnBalance`, which only
       * a settled transfer moves.
       */
      requestWithdrawal: (
        model: FormModel
      ): MockActionReceipt<MockAffiliatePayout> | undefined => {
        const subject = account();
        if (subject === null) return undefined;
        if (!data.features.AFFILIATES_WITHDRAW_REQUEST) {
          return { ok: false, reason: MOCK_RECEIPT_REASON.WITHDRAWAL_DISABLED };
        }
        if (subject.disabled) {
          return { ok: false, reason: MOCK_RECEIPT_REASON.AFFILIATE_DISABLED };
        }
        const available = subject.stats.availableBalance;
        if (available.amount <= 0) {
          return { ok: false, reason: MOCK_RECEIPT_REASON.NOTHING_TO_WITHDRAW };
        }

        const requested: MockAffiliatePayout = {
          id: mockId("payout", map(subject.payouts, "id")),
          requestedAt: today(),
          amount: available,
          destination: subject.payoutDestination.code,
          status: MOCK_PAYOUT_STATUS.PENDING,
          message: submittedText(model, "message")
        };
        subject.payouts.unshift(requested);
        assign(subject.stats, {
          availableBalance: mockMoney(0, available.currency)
        });
        return { ok: true, entity: requested };
      },

      /** Chooses where withdrawals are sent; an unset code follows the brand's own. */
      savePayoutDestination: (
        model: FormModel
      ): MockActionReceipt<MockAffiliate> | undefined => {
        const subject = account();
        if (subject === null) return undefined;
        const code = chosenDestination(model) ?? BRAND_DEFAULT_DESTINATION;
        assign(subject.payoutDestination, {
          code,
          detail: destinationDetail(model, code)
        });
        return { ok: true, entity: subject };
      },

      /** Deletes one referral link; the referrals it brought in stay. */
      removeLink: (
        linkId: string
      ): MockActionReceipt<MockAffiliateLink> | undefined => {
        const subject = account();
        if (subject === null) return undefined;
        const link = find(subject.links, { id: linkId });
        if (link === undefined) return undefined;
        remove(subject.links, { id: linkId });
        return { ok: true, entity: link };
      }
    };
  }
);
