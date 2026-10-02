/** @internal */
import { SortDirection } from "../query/query.types";
import { PAGINATION } from "../query/query.utils";
import { useI18n } from "../system-localisation";
import { AFFILIATE_DEFAULT_SORT } from "./affiliate.types";
import { compact, isEmpty, map } from "lodash-es";
import type {
  AffiliateWithdrawalFormModel,
  PayoutDestinationLookups
} from "./affiliate.types";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/affiliate.schemas
 * @description The withdrawal form, the four listings' criteria schemas and
 * sort uischemas, and the link + payout destination forms (design.md §8.3,
 * §8.5, §8.6, §8.10).
 *
 * WARNING: Do not import directly from another module. Resolve via
 * `useClientAffiliate.ts` / `useAffiliateLinks.ts` / `useAffiliateLinkManager.ts`
 * / `useAffiliateReferrals.ts` / `useAffiliateCommissions.ts` /
 * `useAffiliatePayouts.ts` / `useAffiliatePayoutDestinationManager.ts` only.
 */

// -----------------------------------------------------------------------------
// Criteria column fragments — the operator branch of design.md §8.3

const stringFilterSchema = () => ({
  type: "object",
  additionalProperties: false,
  properties: {
    eq: { type: ["string", "null"] },
    neq: { type: ["string", "null"] },
    // `like` reaches the wire as `%v%` (CONTAINS only) — the query core
    // translator wraps it (design.md §8.3, D-9).
    like: { type: ["string", "null"] }
  }
});

const numberFilterSchema = () => ({
  type: "object",
  additionalProperties: false,
  properties: {
    eq: { type: ["number", "null"] },
    neq: { type: ["number", "null"] },
    gt: { type: ["number", "null"] },
    gte: { type: ["number", "null"] },
    lt: { type: ["number", "null"] },
    lte: { type: ["number", "null"] }
  }
});

const dateFilterSchema = () => ({
  type: "object",
  additionalProperties: false,
  properties: {
    eq: { type: ["string", "null"], format: "date-time" },
    gt: { type: ["string", "null"], format: "date-time" },
    gte: { type: ["string", "null"], format: "date-time" },
    lt: { type: ["string", "null"], format: "date-time" },
    lte: { type: ["string", "null"], format: "date-time" },
    before: { type: ["string", "null"] },
    after: { type: ["string", "null"] }
  }
});

const paginationSchema = (defaultLimit: number) => ({
  type: "object",
  additionalProperties: false,
  properties: {
    limit: { type: "integer", minimum: 0, default: defaultLimit },
    offset: { type: "integer", minimum: 0, default: PAGINATION.offset }
  }
});

/**
 * The withdrawal request form schema — `message` required, trimmed before
 * `minLength` runs (design.md §8.5).
 *
 * @decision `trim: true` is added to the `message` property.
 * what: registers the codebase's custom AJV `trim` keyword
 *      (`utils/useValidationKeywords.ts`'s `useTrimKeyword`) on `message`.
 * why: design.md §8.5 states the withdrawal schema as "message required,
 *      minLength: 1, trim". Without it a whitespace-only message passes
 *      `minLength: 1` (its length is > 0), so `affiliate.schemas.test.ts`'s
 *      "refuses a whitespace-only message" case fails against a real
 *      `useValidation()` run — discovered while verifying this build phase's
 *      own diff, not itself part of the assigned query()-keying fix.
 * rejected: leaving it unfixed and only flagging it — the fix is one line,
 *      inside a file this build phase already owns, and closes a real gap
 *      against the design's own stated contract.
 */
export const useWithdrawalSchema = (): JsonSchema7 => ({
  type: "object",
  properties: {
    message: { type: "string", minLength: 1, trim: true } as JsonSchema7 &
      Record<"trim", boolean>
  },
  required: ["message"]
});

/** The withdrawal request form uischema. */
export const useWithdrawalUischema = (): ControlElement => ({
  type: "Control",
  scope: "#/properties/message",
  i18n: "form.affiliate_withdrawal_message"
});

/**
 * `{ message }`, `message` the translation of `text.affiliate_withdraw_balance`
 * at `{ amount }` — the legacy prefilled withdrawal message (design.md §8.5,
 * `o34`).
 */
export function withdrawalDefaults({
  amount
}: {
  amount?: string;
}): AffiliateWithdrawalFormModel {
  const { t } = useI18n();
  return { message: t("text.affiliate_withdraw_balance", { amount }) };
}

// -----------------------------------------------------------------------------
// Links (design.md §8.3, §8.10)

export function useLinksQuerySchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: stringFilterSchema(),
          redirect_url: stringFilterSchema(),
          visit_count: numberFilterSchema(),
          referral_count: numberFilterSchema(),
          created_at: dateFilterSchema()
        }
      },
      sort: {
        type: "array",
        default: AFFILIATE_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["created_at", "visit_count", "referral_count"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: paginationSchema(10)
    }
  } satisfies JsonSchema7;
}

export function useLinksQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/name/properties/like",
        i18n: "form.affiliate_links_search",
        options: { format: "search", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

export function useLinksSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.affiliate_links_sort"
  };
}

// -----------------------------------------------------------------------------
// Referrals — the dotted `affiliate_link.*` filter keys stay literal (§8.3, §8.9)

export function useReferralsQuerySchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          created_at: dateFilterSchema(),
          "affiliate_link.name": stringFilterSchema(),
          "affiliate_link.redirect_url": stringFilterSchema(),
          "affiliate_link.visit_count": numberFilterSchema(),
          "affiliate_link.referral_count": numberFilterSchema(),
          "affiliate_link.created_at": dateFilterSchema()
        }
      },
      sort: {
        type: "array",
        default: AFFILIATE_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["created_at"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: paginationSchema(5)
    }
  } satisfies JsonSchema7;
}

export function useReferralsQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope:
          "#/properties/filters/properties/affiliate_link.name/properties/like",
        i18n: "form.affiliate_referrals_search",
        options: { format: "search", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

export function useReferralsSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.affiliate_referrals_sort"
  };
}

// -----------------------------------------------------------------------------
// Commissions (design.md §8.3)

export function useCommissionsQuerySchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: { created_at: dateFilterSchema() }
      },
      sort: {
        type: "array",
        default: AFFILIATE_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["amount", "created_at"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: paginationSchema(10)
    }
  } satisfies JsonSchema7;
}

export function useCommissionsQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/created_at",
        i18n: "form.affiliate_commissions_created_filter",
        options: { format: "range", optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

export function useCommissionsSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.affiliate_commissions_sort"
  };
}

// -----------------------------------------------------------------------------
// Payouts (design.md §8.3)

export function usePayoutsQuerySchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: { created_at: dateFilterSchema() }
      },
      sort: {
        type: "array",
        default: AFFILIATE_DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["amount", "created_at"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: paginationSchema(10)
    }
  } satisfies JsonSchema7;
}

export function usePayoutsQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/created_at",
        i18n: "form.affiliate_payouts_created_filter",
        options: { format: "range", optionalText: "" }
      }
    ]
  } as UISchemaElement;
}

export function usePayoutsSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.affiliate_payouts_sort"
  };
}

// -----------------------------------------------------------------------------
// Link form (design.md §8.6, §8.10)

export function useLinkSchema(): JsonSchema7 {
  return {
    type: "object",
    properties: {
      name: { type: ["string", "null"] },
      redirectUrl: { type: "string", minLength: 1 }
    },
    required: ["redirectUrl"]
  } satisfies JsonSchema7;
}

export function useLinkUischema(): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/name",
        i18n: "form.affiliate_link_name"
      },
      {
        type: "Control",
        scope: "#/properties/redirectUrl",
        i18n: "form.affiliate_link_redirect_url"
      }
    ]
  } as UISchemaElement;
}

// -----------------------------------------------------------------------------
// Payout destination form (design.md §8.6, §8.10)

export function usePayoutDestinationSchema(
  lookups: PayoutDestinationLookups = {}
): JsonSchema7 {
  const destinations = compact(
    map(lookups.destinations, d =>
      d.id ? { const: d.id, title: d.name } : undefined
    )
  );
  const emails = map(lookups.emails, e => ({ const: e.id, title: e.email }));

  return {
    type: "object",
    properties: {
      payoutDestinationId: {
        type: ["string", "null"],
        ...(isEmpty(destinations) ? {} : { oneOf: destinations })
      },
      paypalEmailId: {
        type: ["string", "null"],
        ...(isEmpty(emails) ? {} : { oneOf: emails })
      }
    }
  } satisfies JsonSchema7;
}

export function usePayoutDestinationUischema(): UISchemaElement {
  return {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/payoutDestinationId",
        i18n: "form.affiliate_payout_destination"
      },
      {
        type: "Control",
        scope: "#/properties/paypalEmailId",
        i18n: "form.affiliate_payout_paypal_email"
      }
    ]
  } as UISchemaElement;
}
