// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/account-contexts
 * @description What the account pillar's schema modules are handed (plan F4)
 * — the delegate invitation's two pickers, the affiliate's payout
 * destination, the accounts this sign-in may act for, one address's own topic
 * opt-ins, and the notification matrix on file. Each is that module's own
 * context type, built from the live dataset, so a schema stays a function of
 * its context and the dataset facts are spent here.
 */

import { NotificationChannelCodes } from "@upmind-automation/types";
import { AffiliatePayoutDestinationCode } from "@upmind-automation/types";
import { activePersonaAccount, personaAccounts } from "../facades";
import { compact, find, map, toLower, values } from "lodash-es";
import type {
  ParentBrandingContext,
  SwitchAccountContext
} from "../contracts/client-account";
import type {
  AffiliatePayoutDestinationContext,
  AffiliatePayoutDestinationModel
} from "../contracts/client-affiliate";
import type { AffiliateLinkContext } from "../contracts/client-affiliate";
import type { DelegateInviteContext } from "../contracts/client-delegates";
import type {
  EmailTopicOptInsContext,
  EmailTopicRow,
  NotificationPreferenceRow,
  NotificationPreferencesContext
} from "../contracts/user-notifications";
import type { MockAffiliate, MockDataset } from "../types";

/**
 * What `client-delegates`'s own invite builders are handed — everything a
 * specific invitation could name. An account holding neither is offered
 * neither picker, which the schema decides from these same two lists.
 */
export function delegateInviteContext(
  data: MockDataset
): DelegateInviteContext {
  return {
    products: map(data.products, product => ({
      id: product.id,
      name: product.name
    })),
    tickets: map(data.tickets, ticket => ({
      id: ticket.id,
      subject: ticket.subject,
      reference: ticket.reference
    }))
  };
}

/**
 * The destination a client with no affiliate account has. The page renders
 * nothing on that branch, but a context is built before a gate is read.
 */
const EMPTY_DESTINATION: Pick<MockAffiliate, "payoutDestination"> = {
  payoutDestination: {
    code: AffiliatePayoutDestinationCode.WALLET,
    detail: ""
  }
};

/**
 * The destination on file, as the form's model. PayPal is the one destination
 * that names an address, so the stored `detail` is read as one only under
 * that code — under any other it is a wallet or a bank line, and putting it
 * in an email picker would offer a choice nobody made.
 */
function payoutDestinationModel(
  affiliate: Pick<MockAffiliate, "payoutDestination">
): AffiliatePayoutDestinationModel {
  const { code, detail } = affiliate.payoutDestination;
  if (code !== AffiliatePayoutDestinationCode.PAYPAL) return { code };
  return { code, paypalEmail: detail };
}

/**
 * What `client-affiliate`'s own payout-destination builders are handed. The
 * addresses are the client's own emails, as legacy's picker read them; the
 * destinations are the platform's three, which no brand fact narrows here.
 */
export function payoutDestinationContext(
  data: MockDataset
): AffiliatePayoutDestinationContext {
  return {
    destinations: values(AffiliatePayoutDestinationCode),
    emails: compact(map(data.emails, "email")),
    model: payoutDestinationModel(data.affiliate ?? EMPTY_DESTINATION)
  };
}

/**
 * What `client-account`'s own switcher builders are handed — the accounts this
 * sign-in may act for, and the one it is acting for now.
 */
export function switchAccountContext(data: MockDataset): SwitchAccountContext {
  return {
    accounts: personaAccounts(data.persona),
    activeAccountId: activePersonaAccount(data.persona)?.id
  };
}

/**
 * What `user-notifications`'s own opt-in builders are handed — the topics this
 * brand publishes for a single address, and what that address receives today.
 * An address the account does not hold subscribes to nothing, which is the
 * empty list the form opens on.
 */
/**
 * Why one address cannot subscribe to a topic, or nothing where it can: the
 * ACCOUNT has turned that topic off on the email channel, and a per-address
 * opt-in cannot override the account's own preference
 * (`emailTopicOptIns.ts:176-190`).
 */
function accountOptOutReason(
  data: MockDataset,
  topicId: string
): string | undefined {
  const preference = find(data.notificationPreferences, { topic: topicId });
  if (preference === undefined) return undefined;
  if (preference.channels[NotificationChannelCodes.EMAIL]) return undefined;
  return "This account is opted out of this topic on the email channel, so it cannot be enabled for this address.";
}

export function emailTopicOptInsContext(
  data: MockDataset,
  address: string
): EmailTopicOptInsContext {
  const entry = find(
    data.emails,
    candidate => toLower(candidate.email ?? "") === toLower(address)
  );
  return {
    topics: map(
      data.emailTopics,
      (topic): EmailTopicRow => ({
        id: topic.id,
        label: topic.label,
        description: topic.description,
        disabledReason: accountOptOutReason(data, topic.id)
      })
    ),
    email: address,
    optIns: entry?.topicOptIns ?? []
  };
}

/**
 * What `user-notifications`'s own preference builders are handed — the matrix
 * on file, one row per topic the brand publishes.
 */
export function notificationPreferencesContext(
  data: MockDataset
): NotificationPreferencesContext {
  return {
    preferences: map(
      data.notificationPreferences,
      (row): NotificationPreferenceRow => ({
        topicId: row.topic,
        label: row.label,
        mandatory: row.mandatory,
        channels: row.channels
      })
    )
  };
}

/**
 * What `client-account`'s own appearance builders are handed — the appearance
 * on file, which is what legacy's form opened on. An account lending none has
 * no form to open, which the registry answers by returning nothing.
 */
export function parentBrandingContext(
  data: MockDataset
): ParentBrandingContext | undefined {
  const branding = data.parentBranding;
  if (branding === null) return undefined;
  return {
    name: branding.name,
    colour: branding.colour,
    font: branding.font
  };
}

/**
 * What `client-affiliate`'s own link builders are handed — the brand's own
 * default redirect, the domain it names, and the brand's name to state the
 * rule with (`addEditAffiliateLinkModal.vue:16-27,163-166`).
 */
export function affiliateLinkContext(data: MockDataset): AffiliateLinkContext {
  return {
    defaultRedirectUrl: data.features.AFFILIATES_DEFAULT_REDIRECT_LINK,
    brandName: data.brand.name
  };
}
