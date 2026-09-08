// -----------------------------------------------------------------------------
/**
 * @module portal/mock/hostgrid-minimal
 * @description The gates-OFF dataset (plan R9): the same shape, the same row
 * types, every brand gate on its other branch. One shipped dataset could only
 * ever render a gate's ON branch, so the OFF branch had no live exercise at
 * all — the hole gap-doc row X13 names.
 *
 * Built by CLONING the shipped seed and flipping what differs, the way
 * `tests/support/counter-dataset.ts` built the same brand for the test layer:
 * nothing is invented here, so a change to hostgrid's rows reaches this
 * dataset too and the two stay comparable row for row.
 */

import {
  ClientTemplateSlotCodes,
  ContractStatusCodes,
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes,
  PriceDisplayTypes,
  WalletTransactionTypes
} from "@upmind-automation/types";
import { CONSOLIDATION_WEEKDAY } from "./contracts/client-billing-settings.schemas";
import { HOSTGRID_MOCK_DATASET } from "./hostgrid";
import { money, SEED_CURRENCY } from "./hostgrid.filler";
import { MOCK_ENTER_KEY_ACTION, MOCK_TRIAL_END_ACTION } from "./types";
import { assign, filter, map, omit, take } from "lodash-es";
import type { MockDataset } from "./types";

/** One active product — the "a client with almost nothing" surface every empty state is written for. */
const ACTIVE_PRODUCTS = 1;

/** Under one page, so the pager hides itself here and shows itself on hostgrid. */
const INVOICES = 2;

/** One address — nothing to CHOOSE between, which is the other branch of every picker. */
const MINIMAL_ADDRESSES = 1;

/** One of each contact row: every "set another as default" control has nothing to move to. */
const MINIMAL_CONTACTS = 1;

/** One account, so there is nothing to switch BETWEEN — the tenancy control's other branch. */
const MINIMAL_ACCOUNTS = 1;

/** One desk — nothing to CHOOSE between, so the new-ticket form drops the control. */
const MINIMAL_DEPARTMENTS = 1;

/** The day of the month this brand raises its one consolidated invoice on. */
const MINIMAL_CONSOLIDATION_DATE = 15;

/**
 * One currency, no limit, three movements — the wallet's other branch: the
 * per-currency table collapses to a single row and the credit-limit panel has
 * nothing to meter, so it renders nowhere.
 */
const MINIMAL_WALLET: MockDataset["wallet"] = {
  balances: [money(12)],
  transactions: [
    {
      id: "wt-3",
      date: "2026-08-14",
      type: WalletTransactionTypes.SPEND,
      description: "Applied to INV-0095",
      amount: money(-12)
    },
    {
      id: "wt-2",
      date: "2026-07-22",
      type: WalletTransactionTypes.REFUND_TO_WALLET,
      description: "Credit note CN-0013",
      amount: money(6)
    },
    {
      id: "wt-1",
      date: "2026-06-30",
      type: WalletTransactionTypes.ADD,
      description: "Opening top-up",
      amount: money(18)
    }
  ]
};

function minimalDataset(): MockDataset {
  const seed: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  const active = filter(
    seed.products,
    product => product.status === ContractStatusCodes.ACTIVE
  );
  return assign(seed, {
    // No PIN to reveal when the brand's PIN feature is off, and no standing
    // tags — the account card's bare branch. One account to act for, so the
    // menu offers no switch at all.
    persona: assign(omit(seed.persona, ["supportPin", "tags"]), {
      accounts: take(seed.persona.accounts ?? [], MINIMAL_ACCOUNTS),
      // A sign-in name of its OWN, where hostgrid's is its default email —
      // the two branches of legacy's `showUsername` (`accountMenu.vue:111`),
      // which withheld the row rather than print the address twice.
      username: "kestrel-studio"
    }),
    features: {
      CLIENT_NOTES_AND_SECRETS_ENABLED: false,
      SUPPORT_PIN_ENABLED: false,
      DISABLE_SUPPORT_SYSTEM: true,
      DEFAULT_CLIENT_HOMEPAGE: "/",
      UPMIND_BRANDING_ENABLED: false,
      UPMIND_AFFILIATES_ENABLED: false,
      UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED: false,
      showStore: false,
      hideOneTimePurchases: true,
      REQUIRE_REGION_IN_ADDRESS: false,
      CLIENT_ALLOW_ADDRESS_UPDATE: false,
      BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED: false,
      // The two card gates on hostgrid's other branch: this brand settles
      // every stored card itself, and lets a client leave with none on file.
      BILLING_GATEWAY_FORCE_AUTO_PAYMENT: true,
      BILLING_GATEWAY_FORCE_CARD_STORAGE: true,
      PREVENT_CARD_REMOVAL_IF_LAST: false,
      CLIENT_TICKET_SCHEDULING_ENABLED: false,
      AFFILIATES_WITHDRAW_REQUEST: false,
      INVOICE_CONSOLIDATION_ENABLED: false,
      // Left OPEN to the client while the brand runs no consolidation at all:
      // the pair's other reachable combination, and the one that proves the
      // banner and the product form hang off `ENABLED` rather than off who is
      // allowed to press them.
      INVOICE_CONSOLIDATION_RESTRICT_TO_STAFF: false,
      // The MONTHLY branch, on the day of the month the other seed never
      // reads — the two seeds carry opposite rules, as every gate pair here.
      INVOICE_CONSOLIDATION_BASE_RULE:
        InvoiceConsolidationRuleTypes.DAY_OF_MONTH,
      INVOICE_CONSOLIDATION_WEEK_DAY: CONSOLIDATION_WEEKDAY.FRIDAY,
      INVOICE_CONSOLIDATION_DATE: MINIMAL_CONSOLIDATION_DATE,
      // The platform's own default: each term quoted at what that cycle costs.
      PRICE_DISPLAY_TYPE: PriceDisplayTypes.CYCLE,
      SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION: false,
      // What is owed is owed in full here, tax numbers go unchecked, no
      // appearance is lent to anybody, and Enter opens a new line — the four
      // F8 gates on hostgrid's other branch.
      PARTIAL_PAYMENTS_ENABLED: false,
      TAX_NUMBER_VALIDATION_ENABLED: false,
      UI_PARENT_BRANDING_ENABLED: false,
      UI_ENTER_KEY_ACTION: MOCK_ENTER_KEY_ACTION.NEWLINE,
      walletTopUpEnabled: false,
      // Nobody opens an account here, the form asks for no phone and no
      // password, and the screens carry no platform identity — the other
      // branch of every logged-out gate (plan F11).
      CLIENT_REGISTRATION_ENABLED: false,
      REQUIRE_PHONE_ON_REGISTRATION: false,
      UI_WHITELABEL_LOGIN: true,
      registrationPasswordRequired: false,
      recaptchaEnabled: false,
      // No organisations open here, so `/register-org` sends the client to the
      // client registration screen instead (plan F5 O3).
      isUpmindOrgContext: false
    },
    // The one product here is on a trial it will CONTINUE out of — the fourth
    // trial reading, which hostgrid's three (migrate, cancel, pending) leave.
    products: map(take(active, ACTIVE_PRODUCTS), product =>
      assign(product, {
        trialEndsAt: "2026-10-15",
        trialEndAction: MOCK_TRIAL_END_ACTION.CONTINUE
      })
    ),
    // Automatic settlement is the brand's, not the client's, so every card
    // here arrives on — the state a forced brand's rows are actually in.
    paymentMethods: map(seed.paymentMethods, method =>
      assign(method, { autoPayment: true })
    ),
    // One address, so the "no second address to choose" branch of the product
    // settings picker renders somewhere.
    addresses: take(seed.addresses, MINIMAL_ADDRESSES),
    emails: take(seed.emails, MINIMAL_CONTACTS),
    phones: take(seed.phones, MINIMAL_CONTACTS),
    // A client invoiced as a person: the companies panel's empty branch, and
    // with it the "no tax number to validate" one.
    companies: [],
    customFields: [],
    // Nothing restricted, so the whitelist panel renders its empty state.
    ipWhitelist: [],
    invoices: take(seed.invoices, INVOICES),
    tickets: [],
    // One desk, so the new-ticket form asks nobody which to raise it with —
    // the other branch of that gate.
    departments: take(seed.departments, MINIMAL_DEPARTMENTS),
    delegates: [],
    childAccounts: [],
    // No children to lend an appearance to, and mail is going out on time —
    // the other branch of the brand-appearance panel and the delay notice.
    parentBranding: null,
    emailDeliveryDelayed: false,
    vault: [],
    affiliate: null,
    // A brand that has written nothing into its pages: every template row
    // renders nowhere, which is the other branch of R12. The footer stays,
    // because a footer with no brand line still carries the shell's own.
    templates: filter(seed.templates, {
      code: ClientTemplateSlotCodes.FOOTER
    }),
    // No extra pages, so the nav injects nothing and the catch-all's
    // not-found branch is what an unknown path reaches.
    customPages: [],
    // No gateway stores a card here, which is what makes "Add card" absent and
    // legacy's no-stored-gateways message render (gap-doc row X13).
    gateways: [],
    wallet: MINIMAL_WALLET,
    // One list is what everybody here is quoted from, so the settings form
    // offers no price-list control at all — the other branch of that gate.
    priceLists: [
      { id: "pl-standard", name: "Standard", currency: SEED_CURRENCY }
    ],
    // Nothing consolidated and nothing to pay in a second currency: the
    // settings form renders its shortest shape (gap-doc row X13).
    billingSettings: {
      currency: SEED_CURRENCY,
      consolidation: InvoiceConsolidationTypes.DISABLED
    },
    // No published rate, so every document is payable in its own currency and
    // no other — the other branch of legacy's Pay dropdown.
    currencyRates: {},
    // A brand that asks nothing on the way out — the cancellation dialog
    // renders its own three fields and no others.
    cancellationFields: [],
    // No topics published, so the per-address opt-in screen has nothing to
    // offer — the other branch of legacy's "all topics opted out" state.
    emailTopics: []
  });
}

/** The gates-OFF brand's own dataset — a fresh object, never a view onto hostgrid's. */
export const HOSTGRID_MINIMAL_MOCK_DATASET: MockDataset = minimalDataset();
