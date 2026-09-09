// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-affiliate.schemas
 * @description Schema/uischema for the three forms the SCOPED
 * `client-affiliate` module headless does not have yet carries (plan F4) — a
 * referral link, a withdrawal request, and where withdrawals are sent.
 * Written in the headless shape, so `/scoped-composable-factory` consumes
 * this file unchanged alongside `client-affiliate.ts`'s four-layer contract.
 *
 * The PayPal address is picked from the client's own emails rather than typed:
 * legacy's own form read the same list, and an affiliate paid at an address
 * the account does not hold is an affiliate who never sees the money.
 *
 * @module-oracle vue-app `addEditAffiliateLinkModal.vue`,
 * `commissionWithdrawRequestModal.vue`, `payoutDestination.vue`.
 */

import { RuleEffect } from "@jsonforms/core";
import { AffiliatePayoutDestinationCode } from "@upmind-automation/types";
import { compact, includes, map, size } from "lodash-es";
import type {
  AffiliateLinkContext,
  AffiliateLinkModel,
  AffiliatePayoutDestinationContext,
  AffiliatePayoutDestinationModel,
  AffiliateWithdrawalModel
} from "./client-affiliate";
import type {
  ControlElement,
  JsonSchema7,
  Rule,
  VerticalLayout
} from "@jsonforms/core";

/** One pick-list choice as the UI renderers read it — not a core schema keyword. */
type SchemaChoice = { label: string; value: string | number };

type SchemaProperty = JsonSchema7 & {
  options?: SchemaChoice[];
  trim?: boolean;
};

/** Legacy's own bound: a link name is one line long. */
const LINK_NAME_MAX_LENGTH = 60;

/**
 * What each destination is called in the form that chooses it. The schema
 * module carries its own copy rather than reaching for the status tables: a
 * schema is data handed to the factory whole, and a stand-in that imports the
 * portal's presentation layer could not go with it.
 */
const DESTINATION_LABEL: Readonly<
  Record<AffiliatePayoutDestinationCode, string>
> = {
  [AffiliatePayoutDestinationCode.WALLET]: "Account credit",
  [AffiliatePayoutDestinationCode.OFFLINE]: "Bank transfer",
  [AffiliatePayoutDestinationCode.PAYPAL]: "PayPal"
};

// --- referral links -----------------------------------------------------------

/** Schema for the create/edit link form. */
export const useLinkSchema = (context: AffiliateLinkContext): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    redirectUrl: {
      type: "string",
      title: "Where the link lands",
      description: redirectInstruction(context),
      format: "uri",
      minLength: 1
    },
    name: {
      type: "string",
      title: "Your name for it",
      maxLength: LINK_NAME_MAX_LENGTH,
      trim: true
    }
  };
  return {
    type: "object",
    title: "Referral link",
    required: ["redirectUrl"],
    properties
  };
};

/**
 * What the field says about itself. Legacy's notice is UNCONDITIONAL words
 * over the control — "for security reasons all redirect URLs must contain a
 * hostname that match a {brandName} {brandDomain}", where `{brandDomain}` is
 * a LINK to the brand's domain settings rather than a value the form knows.
 * The field's one rule is `required`; nothing here checks a host.
 */
function redirectInstruction(context: AffiliateLinkContext): string {
  const landing = "The page anyone following it is taken to.";
  return `${landing} For security it has to be on one of ${context.brandName}'s own domains.`;
}

/** UI schema for the create/edit link form. */
export const useLinkUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/redirectUrl",
      i18n: "form.affiliate_redirect_url",
      options: { placeholder: "https://example.com/pricing" }
    },
    {
      type: "Control",
      scope: "#/properties/name",
      i18n: "form.affiliate_link_name",
      options: { placeholder: "Newsletter, podcast, footer…" }
    }
  ]
});

/**
 * What a NEW link opens on — the brand's own default redirect, which legacy
 * read straight into the field (`addEditAffiliateLinkModal.vue:163-166`), and
 * a blank name. A brand publishing no default opens the field empty.
 */
export const linkDefaults = (
  context: AffiliateLinkContext
): AffiliateLinkModel => ({
  redirectUrl: context.defaultRedirectUrl ?? "",
  name: ""
});

// --- withdrawal request -------------------------------------------------------

/** Schema for the withdrawal request — legacy asked for a message and nothing else. */
export const useWithdrawalSchema = (): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    message: {
      type: "string",
      title: "Anything we should know?",
      minLength: 1,
      trim: true
    }
  };
  return {
    type: "object",
    title: "Withdrawal request",
    required: ["message"],
    properties
  };
};

/** UI schema for the withdrawal request. */
export const useWithdrawalUischema = (): VerticalLayout => ({
  type: "VerticalLayout",
  elements: [
    {
      type: "Control",
      scope: "#/properties/message",
      i18n: "form.affiliate_withdrawal_message",
      options: {
        multi: true,
        placeholder: "Where to send it, or anything else we should know"
      }
    }
  ]
});

/** What the withdrawal request opens on. */
export const withdrawalDefaults = (): AffiliateWithdrawalModel => ({
  message: ""
});

// --- payout destination -------------------------------------------------------

function destinationChoices(
  context: AffiliatePayoutDestinationContext
): SchemaChoice[] {
  return map(context.destinations, code => ({
    label: DESTINATION_LABEL[code],
    value: code
  }));
}

function emailChoices(
  context: AffiliatePayoutDestinationContext
): SchemaChoice[] {
  return map(context.emails, email => ({ label: email, value: email }));
}

/** Whether PayPal is one of the destinations this brand settles through. */
function offersPaypal(context: AffiliatePayoutDestinationContext): boolean {
  return includes(context.destinations, AffiliatePayoutDestinationCode.PAYPAL);
}

/** Whether the account holds an address PayPal could be paid at. */
function offersPaypalEmail(
  context: AffiliatePayoutDestinationContext
): boolean {
  return offersPaypal(context) && size(context.emails) > 0;
}

/**
 * Schema for the payout-destination form. The destination is nullable: legacy
 * let an affiliate leave it to the brand's own default, which is what an
 * absent code means.
 */
export const usePayoutDestinationSchema = (
  context: AffiliatePayoutDestinationContext
): JsonSchema7 => {
  const properties: Record<string, SchemaProperty> = {
    code: {
      type: ["string", "null"],
      title: "Where we send your earnings",
      description: "Leave it unset to follow the brand's own default.",
      enum: [null, ...context.destinations],
      options: destinationChoices(context)
    }
  };

  if (offersPaypalEmail(context)) {
    properties["paypalEmail"] = {
      type: ["string", "null"],
      title: "PayPal address",
      enum: [null, ...context.emails],
      options: emailChoices(context)
    };
  }

  return {
    type: "object",
    title: "Payout destination",
    properties,
    // PayPal is the one destination that needs an address, and it is asked
    // for only while that destination stands (plan F5).
    if: {
      properties: { code: { const: AffiliatePayoutDestinationCode.PAYPAL } },
      required: ["code"]
    },
    then: {
      required: compact([offersPaypalEmail(context) && "paypalEmail"])
    }
  };
};

function control(scope: string, rule?: Rule): ControlElement {
  return { type: "Control", scope: `#/properties/${scope}`, rule };
}

/** Shown while the earnings go to PayPal, and nowhere else. */
function whilePaypal(): Rule {
  return {
    effect: RuleEffect.SHOW,
    condition: {
      scope: "#/properties/code",
      schema: { enum: [AffiliatePayoutDestinationCode.PAYPAL] }
    }
  };
}

/** UI schema for the payout-destination form. */
export const usePayoutDestinationUischema = (
  context: AffiliatePayoutDestinationContext
): VerticalLayout => ({
  type: "VerticalLayout",
  elements: compact([
    {
      type: "Control",
      scope: "#/properties/code",
      i18n: "form.affiliate_payout_destination",
      options: { format: "radio" }
    },
    offersPaypalEmail(context) && control("paypalEmail", whilePaypal())
  ])
});

/** What the payout-destination form opens on — the destination on file. */
export const payoutDestinationDefaults = (
  context: AffiliatePayoutDestinationContext
): AffiliatePayoutDestinationModel => ({
  code: context.model.code,
  paypalEmail: context.model.paypalEmail
});
