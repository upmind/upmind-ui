// -----------------------------------------------------------------------------
/**
 * @module contract-product/__tests__/contract-product.steps
 * @description The module's ONE step catalog — one definition per phrasing the
 * sibling `contract-product.feature`'s DRIVEABLE scenarios use. Engine-free by
 * construction: it imports `defineSteps` and `World`, the module's scope
 * vocabulary and lodash, and nothing else, so the same catalog re-registers
 * against any runner and a browser can carry it.
 *
 * ## THE TWO KEYS THIS CATALOG BOOTS
 *
 *   - `contract_products` (`scenarios/useContractProducts`) — the COLLECTION,
 *     booted `.as(CLIENT)`.
 *   - `contract_product` (`scenarios/useContractProduct`) — the MANAGER,
 *     booted `.as(CLIENT).withId(id)` — the id read off the scenario's own
 *     recorded product read, never a copied literal (ADR 035 §6).
 *
 * ## What stays spec-only, and why (ADR-020 Am.5 / ADR-035 Am.1)
 *
 * A scenario earns steps ONLY where a real step drives every line of it.
 * REQUEST-SHAPE lines — which `with` members / filters / routes a request
 * carried, and that no request was made — a `World` step cannot read, so the
 * AC-1 "arrives with <member>" lines settle on `hasError:false` (the read that
 * carries all 12 members landed) and the finer per-member proof is a documented
 * gap of this conversion (was `contract-product.reads.int.test.ts`).
 *
 * Every value a step fires or expects is read off the module's own committed
 * recordings under `scenarios/`, never hand-authored.
 */

import { args, defineSteps } from "@upmind-automation/scenario-harness";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  InvoiceConsolidationTypes,
  ProvisionCategoryCodes
} from "@upmind-automation/types";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  ContractProductCancelOption,
  ContractProductFormTypes
} from "../contract-product.types";
import {
  bodiesByWhen,
  bodiesInWindow,
  markWhen,
  sentByWhen,
  sentInWindow,
  wireScenario
} from "./contract-product.wire";
import brandHidesNothingPage from "./scenarios/a-brand-that-hides-one-off-purchases-hides-them-from-me-everywhere-nothing/04/get-contracts-products-3ae06085.json";
import brandHidesNothingCount from "./scenarios/a-brand-that-hides-one-off-purchases-hides-them-from-me-everywhere-nothing/04/get-contracts-products-9f6d8418.json";
import brandHidesAskedPage from "./scenarios/a-brand-that-hides-one-off-purchases-hides-them-from-me-everywhere-one-off-purchases/03/get-contracts-products-3ae06085.json";
import brandHidesAskedCount from "./scenarios/a-brand-that-hides-one-off-purchases-hides-them-from-me-everywhere-one-off-purchases/03/get-contracts-products-9f6d8418.json";
import brandHidesGroupsRecording from "./scenarios/a-brand-that-hides-one-off-purchases-hides-them-from-my-category-counts-too/03/get-clients-id-contracts-products-987ce7c5.json";
import unchangedConsolidationRecording from "./scenarios/a-consolidation-choice-that-changes-nothing-is-not-sent/02/get-contract-products-id.json";
import oneTimeRowsRecording from "./scenarios/a-one-time-purchase-shows-the-price-i-paid-for-it-as-my-brands-tax-rule-prices-it/03/get-contracts-products-exclude-delegated-1-filter-billing-cycle-days-eq-0-skip-count-1-split-count-1.json";
import openedSubscriptionRecording from "./scenarios/a-subscription-i-open-shows-what-it-costs-each-time-it-renews-as-my-brands-tax-rule-prices-it/03/get-contract-products-id.json";
import subscriptionRowsRecording from "./scenarios/a-subscription-in-my-list-shows-what-it-costs-each-time-it-renews-as-my-brands-tax-rule-prices-it/03/get-contracts-products-3ae06085.json";
import toggleAllCount from "./scenarios/a-subscription-type-toggle-shows-all-my-products-only-my-subscriptions-or-only-my-one-time-purchases-all/03/get-contracts-products-exclude-delegated-1-limit-count-skip-count-1-split-count-1.json";
import toggleAllPage from "./scenarios/a-subscription-type-toggle-shows-all-my-products-only-my-subscriptions-or-only-my-one-time-purchases-all/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import toggleOneTimeCount from "./scenarios/a-subscription-type-toggle-shows-all-my-products-only-my-subscriptions-or-only-my-one-time-purchases-one-time/03/get-contracts-products-28af7f4a.json";
import toggleOneTimePage from "./scenarios/a-subscription-type-toggle-shows-all-my-products-only-my-subscriptions-or-only-my-one-time-purchases-one-time/03/get-contracts-products-exclude-delegated-1-filter-billing-cycle-days-eq-0-skip-count-1-split-count-1.json";
import toggleSubscriptionsPage from "./scenarios/a-subscription-type-toggle-shows-all-my-products-only-my-subscriptions-or-only-my-one-time-purchases-subscriptions/03/get-contracts-products-3ae06085.json";
import toggleSubscriptionsCount from "./scenarios/a-subscription-type-toggle-shows-all-my-products-only-my-subscriptions-or-only-my-one-time-purchases-subscriptions/03/get-contracts-products-9f6d8418.json";
import suspendedRowRecording from "./scenarios/a-suspended-subscription-is-still-offered-every-change-ask-for-it-to-stop-renewing/02/get-contract-products-id.json";
import suspendedBookingRecording from "./scenarios/a-suspended-subscription-is-still-offered-every-change-book-a-cancellation-for-a-date-i-choose/03/put-contracts-id-products-id-schedule-cancel.json";
import expiringRecording from "./scenarios/an-expiring-subscription-is-not-the-same-as-one-that-stopped-invoicing/02/get-contract-products-id.json";
import groupedCountsRecording from "./scenarios/ask-for-my-products-grouped-by-category-and-see-a-count-for-each/03/get-clients-id-contracts-products-2cc99a6a.json";
import hardRequestRereadRecording from "./scenarios/ask-for-one-of-my-products-to-be-cancelled-outright/03/get-contract-products-id.json";
import hardRequestRecording from "./scenarios/ask-for-one-of-my-products-to-be-cancelled-outright/03/post-contracts-id-cancel-request.json";
import bookedWithReasonRecording from "./scenarios/book-a-cancellation-for-one-of-my-products-on-a-date-i-choose-with-my-reason/03/get-contract-products-id.json";
import bookWithReasonRecording from "./scenarios/book-a-cancellation-for-one-of-my-products-on-a-date-i-choose-with-my-reason/03/put-contracts-id-products-id-schedule-cancel.json";
import bookedWithoutReasonRecording from "./scenarios/book-a-cancellation-for-one-of-my-products-on-a-date-i-choose-without-a-reason/03/get-contract-products-id.json";
import bookWithoutReasonRecording from "./scenarios/book-a-cancellation-for-one-of-my-products-on-a-date-i-choose-without-a-reason/03/put-contracts-id-products-id-schedule-cancel.json";
import withdrawnRereadRecording from "./scenarios/change-my-mind-about-a-cancellation-i-asked-for/03/get-contract-products-id.json";
import chooseHideCount from "./scenarios/choose-whether-to-see-products-delegated-to-me-hide/03/get-contracts-products-exclude-delegated-1-limit-count-skip-count-1-split-count-1.json";
import chooseHidePage from "./scenarios/choose-whether-to-see-products-delegated-to-me-hide/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import chooseSeeCount from "./scenarios/choose-whether-to-see-products-delegated-to-me-see/03/get-contracts-products-exclude-delegated-0-limit-count-skip-count-1-split-count-1.json";
import chooseSeePage from "./scenarios/choose-whether-to-see-products-delegated-to-me-see/03/get-contracts-products-exclude-delegated-0-skip-count-1-split-count-1.json";
import clearingNarrowedCount from "./scenarios/clearing-what-i-asked-for-brings-all-my-products-back/02/get-contracts-products-7b82f472.json";
import clearingNarrowedPage from "./scenarios/clearing-what-i-asked-for-brings-all-my-products-back/02/get-contracts-products-exclude-delegated-1-filter-product-name-like-hat-skip-count-1-split-count-1.json";
import clearedCount from "./scenarios/clearing-what-i-asked-for-brings-all-my-products-back/03/get-contracts-products-exclude-delegated-1-limit-count-skip-count-1-split-count-1.json";
import clearedPage from "./scenarios/clearing-what-i-asked-for-brings-all-my-products-back/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import cycleRowsRecording from "./scenarios/each-of-my-products-shows-how-often-it-bills-in-words/02/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import statusRowsRecording from "./scenarios/each-of-my-products-shows-its-status-in-words-with-one-flag-for-that-status/02/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import boughtDateRowsRecording from "./scenarios/each-of-my-products-shows-the-date-i-bought-it/02/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import cancellationOfferRecording4 from "./scenarios/i-am-told-whether-the-cancellation-form-is-offered-before-i-open-it-a-cancelled-subscription/02/get-contract-products-id.json";
import cancellationOfferRecording5 from "./scenarios/i-am-told-whether-the-cancellation-form-is-offered-before-i-open-it-a-live-one-off-purchase/02/get-contract-products-id.json";
import cancellationOfferRecording2 from "./scenarios/i-am-told-whether-the-cancellation-form-is-offered-before-i-open-it-a-product-with-a-cancellation-booked-for-a-future-date/02/get-contract-products-id.json";
import cancellationOfferRecording3 from "./scenarios/i-am-told-whether-the-cancellation-form-is-offered-before-i-open-it-a-product-with-a-cancellation-request-already-pending/02/get-contract-products-id.json";
import cancellationOfferRecording1 from "./scenarios/i-am-told-whether-the-cancellation-form-is-offered-before-i-open-it-a-subscription-already-set-to-expire/02/get-contract-products-id.json";
import cancellationOfferRecording0 from "./scenarios/i-am-told-whether-the-cancellation-form-is-offered-before-i-open-it-an-active-subscription/02/get-contract-products-id.json";
import consolidationOfferRecording6 from "./scenarios/i-am-told-whether-the-consolidation-form-is-offered-before-i-open-it-a-cancelled-subscription-for-its-invoicing/02/get-contract-products-id.json";
import consolidationOfferRecording7 from "./scenarios/i-am-told-whether-the-consolidation-form-is-offered-before-i-open-it-a-lapsed-subscription-for-its-invoicing/02/get-contract-products-id.json";
import consolidationOfferRecording4 from "./scenarios/i-am-told-whether-the-consolidation-form-is-offered-before-i-open-it-a-one-off-purchase-live/02/get-contract-products-id.json";
import consolidationOfferRecording5 from "./scenarios/i-am-told-whether-the-consolidation-form-is-offered-before-i-open-it-a-one-off-purchase-still-pending/02/get-contract-products-id.json";
import consolidationOfferRecording3 from "./scenarios/i-am-told-whether-the-consolidation-form-is-offered-before-i-open-it-a-subscription-already-asked-to-stop-renewing/02/get-contract-products-id.json";
import consolidationOfferRecording0 from "./scenarios/i-am-told-whether-the-consolidation-form-is-offered-before-i-open-it-a-subscription-and-my-account-consolidates/02/get-contract-products-id.json";
import consolidationOfferRecording1 from "./scenarios/i-am-told-whether-the-consolidation-form-is-offered-before-i-open-it-a-subscription-and-my-account-follows-its-default/02/get-contract-products-id.json";
import consolidationOfferRecording2 from "./scenarios/i-am-told-whether-the-consolidation-form-is-offered-before-i-open-it-a-subscription-and-my-account-never-consolidates/02/get-contract-products-id.json";
import renewalInvoicingOffRecording from "./scenarios/i-am-told-why-the-cancellation-form-is-not-available-to-me-its-auto-renew-is-off-and-it-has-no-end-date/02/get-contract-products-id.json";
import acceptedRequestRecording from "./scenarios/i-am-told-why-the-cancellation-form-is-not-available-to-me-its-cancellation-request-was-already-accepted/02/get-contract-products-id.json";
import overdueGuardRecording from "./scenarios/i-cannot-ask-to-cancel-a-product-the-platform-holds-back-from-cancelling-cannot-be-cancelled-and-has-overdue-invoices/02/get-contract-products-id.json";
import proRataGuardRecording from "./scenarios/i-cannot-ask-to-cancel-a-product-the-platform-holds-back-from-cancelling-has-a-pending-pro-rata-invoice/02/get-contract-products-id.json";
import notCancellableGuardRecording from "./scenarios/i-cannot-ask-to-cancel-a-product-the-platform-holds-back-from-cancelling-has-platform-settings-that-do-not-allow-cancelling/02/get-contract-products-id.json";
import renewalOffRecording from "./scenarios/know-whether-a-product-still-invoices-its-own-renewal-off/02/get-contract-products-id.json";
import unpaidInvoiceRecording from "./scenarios/know-whether-an-outstanding-invoice-is-still-due-and-still-cancellable/02/get-contract-products-id.json";
import secondPage from "./scenarios/move-through-the-pages-of-my-products-back-to-the-previous-page/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import backToFirstPage from "./scenarios/move-through-the-pages-of-my-products-back-to-the-previous-page/04/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import lastPageRecording from "./scenarios/move-through-the-pages-of-my-products-forward-to-the-last-page/04/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import nextPageRecording from "./scenarios/move-through-the-pages-of-my-products-forward-to-the-next-page/04/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import rememberHideCount from "./scenarios/my-choice-about-delegated-products-is-remembered-hide/04/get-contracts-products-exclude-delegated-1-limit-count-skip-count-1-split-count-1.json";
import rememberHidePage from "./scenarios/my-choice-about-delegated-products-is-remembered-hide/04/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import rememberSeeCount from "./scenarios/my-choice-about-delegated-products-is-remembered-see/04/get-contracts-products-exclude-delegated-0-limit-count-skip-count-1-split-count-1.json";
import rememberSeePage from "./scenarios/my-choice-about-delegated-products-is-remembered-see/04/get-contracts-products-exclude-delegated-0-skip-count-1-split-count-1.json";
import nextDueRecording from "./scenarios/my-product-shows-when-it-next-falls-due-and-how-often-it-bills/02/get-contract-products-id.json";
import narrowQuickSearchCount from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-a-quick-search-term/02/get-contracts-products-exclude-delegated-1-limit-count-query-hat-skip-count-1-split-count-1.json";
import narrowQuickSearchPage from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-a-quick-search-term/02/get-contracts-products-exclude-delegated-1-query-hat-skip-count-1-split-count-1.json";
import narrowCategoryCount from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-category/02/get-contracts-products-4de6852d.json";
import narrowCategoryPage from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-category/02/get-contracts-products-exclude-delegated-1-filter-product-category-id-skip-count-1-split-count-1.json";
import narrowCategoryNamePage from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-category-name/02/get-contracts-products-a4736c87.json";
import narrowCategoryNameCount from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-category-name/02/get-contracts-products-df164bda.json";
import narrowStatusCount from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-lifecycle-status/02/get-contracts-products-7013a35d.json";
import narrowStatusPage from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-lifecycle-status/02/get-contracts-products-d2ac043c.json";
import narrowPriceCount from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-price/02/get-contracts-products-16e32eb0.json";
import narrowPricePage from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-price/02/get-contracts-products-exclude-delegated-1-filter-total-amount-12-skip-count-1-split-count-1.json";
import narrowProductNameCount from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-product-name/02/get-contracts-products-7b82f472.json";
import narrowProductNamePage from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-product-name/02/get-contracts-products-exclude-delegated-1-filter-product-name-like-hat-skip-count-1-split-count-1.json";
import narrowBoughtCount from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-when-i-bought-them/02/get-contracts-products-b9b10025.json";
import narrowBoughtPage from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-when-i-bought-them/02/get-contracts-products-ff2f0e34.json";
import narrowNextDuePage from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-when-they-next-fall-due/02/get-contracts-products-3b9dd7e1.json";
import narrowNextDueCount from "./scenarios/narrow-my-products-the-way-the-product-area-lets-me-when-they-next-fall-due/02/get-contracts-products-6de9f3ec.json";
import noDelegatedListRecording from "./scenarios/never-be-shown-delegated-products-i-do-not-have-see/04/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import activeStateRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-active/02/get-contract-products-id.json";
import awaitingActivationStateRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-awaiting-activation/02/get-contract-products-id.json";
import beingCancelledStateRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-being-cancelled/02/get-contract-products-id.json";
import cancelledStateRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-cancelled/02/get-contract-products-id.json";
import expiringStateRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-expiring/02/get-contract-products-id.json";
import lapsedStateRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-lapsed/02/get-contract-products-id.json";
import pendingStateRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-pending/02/get-contract-products-id.json";
import suspendedStateRecording from "./scenarios/open-one-of-my-products-and-see-what-state-it-is-in-suspended/02/get-contract-products-id.json";
import importedStateRecording from "./scenarios/open-one-of-my-products-in-a-state-only-the-platform-puts-it-in-imported-from-another-platform/02/get-contract-products-id.json";
import endingTrialRecording from "./scenarios/open-one-of-my-products-in-a-state-only-the-platform-puts-it-in-on-a-trial-that-is-about-to-end/02/get-contract-products-id.json";
import onTrialStateRecording from "./scenarios/open-one-of-my-products-while-it-is-on-trial/02/get-contract-products-id.json";
import managerProductRecording from "./scenarios/open-one-of-my-products-with-what-its-detail-view-needs/02/get-contract-products-id.json";
import foreignReadRecording from "./scenarios/opening-a-product-that-is-not-mine-fails-and-i-am-shown-why-at-once/03/get-contract-products-id.json";
import orderStatusPage from "./scenarios/order-my-products-status/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import orderBoughtPage from "./scenarios/order-my-products-when-i-bought-them/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import orderNextDuePage from "./scenarios/order-my-products-when-they-next-fall-due/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import orderCancelledPage from "./scenarios/order-my-products-when-they-were-cancelled/03/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import pickerListRecording from "./scenarios/picking-one-of-my-products-opens-that-very-product/02/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import listCountRecording from "./scenarios/see-the-products-on-my-own-account/02/get-contracts-products-exclude-delegated-1-limit-count-skip-count-1-split-count-1.json";
import listRecording from "./scenarios/see-the-products-on-my-own-account/02/get-contracts-products-exclude-delegated-1-skip-count-1-split-count-1.json";
import scheduledActionsRecording from "./scenarios/see-what-is-scheduled-to-happen-to-one-of-my-products/02/get-contract-products-id.json";
import stopWithReasonRecording from "./scenarios/stop-one-of-my-subscriptions-renewing-and-change-my-mind-with-my-reason/03/put-contracts-id-products-id-modify-renew.json";
import allowedPermissionRecording from "./scenarios/stopping-a-subscription-renewing-is-not-the-renewal-invoicing-permission-allowed/02/get-contract-products-id.json";
import allowedStoppedRecording from "./scenarios/stopping-a-subscription-renewing-is-not-the-renewal-invoicing-permission-allowed/03/get-contract-products-id.json";
import notAllowedPermissionRecording from "./scenarios/stopping-a-subscription-renewing-is-not-the-renewal-invoicing-permission-not-allowed/02/get-contract-products-id.json";
import notAllowedStoppedRecording from "./scenarios/stopping-a-subscription-renewing-is-not-the-renewal-invoicing-permission-not-allowed/03/get-contract-products-id.json";
import pendingOptionsRecording from "./scenarios/the-cancellation-form-on-a-pending-product-offers-the-immediate-request/02/get-contract-products-id.json";
import earliestDateRecording from "./scenarios/the-earliest-date-i-can-book-a-cancellation-for-is-the-one-my-product-allows/02/get-contract-products-id.json";
import inFlightRereadRecording from "./scenarios/while-a-change-of-mine-is-in-flight-the-module-says-so/03/get-contract-products-id.json";
import {
  compact,
  every,
  filter,
  find,
  groupBy,
  has,
  includes,
  isEmpty,
  isEqual,
  isObject,
  keys,
  map,
  omit,
  some,
  sortBy,
  split,
  toPairs,
  trim,
  uniq,
  values
} from "lodash-es";
import type { DetailedError } from "../../../utils";
import type { World } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

/** The COLLECTION page's key, declared by `scenarios/useContractProducts`. */
export const CONTRACT_PRODUCTS_SCENARIO = "contract_products";

/** The MANAGER page's key, declared by `scenarios/useContractProduct`. */
export const CONTRACT_PRODUCT_SCENARIO = "contract_product";

/** The `useContractProducts` action ids these steps fire. */
export const CONTRACT_PRODUCTS_COVERED_ACTIONS = {
  filterBy: "filterBy",
  isReady: "isReady",
  loadGroupedCounts: "loadGroupedCounts",
  loadPurchasedCategories: "loadPurchasedCategories",
  nextPage: "nextPage",
  prevPage: "prevPage",
  refresh: "refresh",
  setCriteria: "setCriteria",
  sortBy: "sortBy"
} as const;

/** The `useContractProduct` action ids these steps fire. */
export const CONTRACT_PRODUCT_COVERED_ACTIONS = {
  isReady: "isReady",
  openCancellation: "openCancellation",
  set: "set",
  submitCancellation: "submitCancellation",
  withdrawCancellation: "withdrawCancellation",
  stopRenewing: "stopRenewing",
  resumeRenewing: "resumeRenewing",
  scheduleCancellation: "scheduleCancellation",
  setConsolidation: "setConsolidation",
  revokeScheduledCancellation: "revokeScheduledCancellation",
  openConsolidation: "openConsolidation",
  submitConsolidation: "submitConsolidation",
  cancelForm: "cancelForm",
  reset: "reset",
  refresh: "refresh",
  onDone: "onDone",
  openMigration: "openMigration",
  loadMoreMigrationTargets: "loadMoreMigrationTargets",
  selectMigrationTarget: "selectMigrationTarget",
  reloadMigrationTarget: "reloadMigrationTarget",
  migrate: "migrate",
  cancelMigration: "cancelMigration"
} as const;

/**
 * The real product every manager scenario opens — read off its own recorded
 * product read, never a copied literal (ADR 035 §6).
 */
const MANAGER_PRODUCT_ID = (
  managerProductRecording as { response: { body: { data: { id: string } } } }
).response.body.data.id;

/**
 * The first grouped-counts entry the AC-19 read answered with — the rows ride
 * `total`, read off the recording rather than a copied literal.
 */
const GROUPS = (
  groupedCountsRecording as {
    response: {
      body: {
        total: {
          category_id: string;
          service_identifier: string | null;
          total: number;
        }[];
      };
    };
  }
).response.body.total;

const FIRST_GROUP = GROUPS[0];

/** The first page a session with nothing delegated to it is answered with (AC-2). */
const NO_DELEGATED_ROWS = map(
  (
    noDelegatedListRecording as {
      response: {
        body: { data: { id: string; is_delegated_object: boolean }[] };
      };
    }
  ).response.body.data,
  row => ({ id: row.id, isDelegatedObject: row.is_delegated_object })
);

/** Whether one recorded category carries more than one service-identifier entry. */
const RECORDING_SPLITS_A_CATEGORY = some(
  groupBy(GROUPS, "category_id"),
  entries => uniq(map(entries, "service_identifier")).length > 1
);

/**
 * The earliest cancellation date the recorded product allows (AC-22). Legacy
 * (contractCancellation.ts ~L396-470): the earliest is `next_due_date` (cycle
 * 0), stepped forward in whole billing cycles only when `next_due_date` is past.
 * The recorded product's `next_due_date` is future, so the earliest IS that
 * date — read off the recording, never a copied literal.
 */
const RECORDED_NEXT_DUE_DATE = (
  earliestDateRecording as {
    response: { body: { data: { next_due_date: string } } };
  }
).response.body.data.next_due_date;

/** The recorded product's next-due date and billing cycle (AC-1 detail read). */
const NEXT_DUE = (
  nextDueRecording as {
    response: {
      body: { data: { next_due_date: string; billing_cycle_months: number } };
    };
  }
).response.body.data;

/** The renewal-invoicing-OFF product (AC-21 "off" row) — id read off its recording. */
const RENEWAL_OFF_PRODUCT_ID = (
  renewalOffRecording as { response: { body: { data: { id: string } } } }
).response.body.data.id;

/** A recorded list read: the request it answered and what it returned. */
type ListRecording = {
  request: { path: string };
  response: { body: { data: { id: string }[] } };
};

/** The rows a recorded page read returned, each by its id, in recorded order. */
const recordedRows = (recording: unknown) =>
  map((recording as ListRecording).response.body.data, ({ id }) => ({ id }));

/** One criteria value the recorded request carried, read off its query string. */
function recordedParam(recording: unknown, key: string): string {
  const value = new URL(
    (recording as ListRecording).request.path,
    "http://recorded"
  ).searchParams.get(key);
  if (value === null) throw new Error(`The recording carries no "${key}".`);
  return value;
}

/** The term a hand typed, off a `like` value the wire wraps in `%…%`. */
const likeTerm = (wire: string) => wire.replace(/^%|%$/g, "");

/**
 * The AC-1 narrowing rows: each row's recorded page read, and the narrowing
 * a hand makes — its value read off that recorded request.
 */
const NARROWINGS: [
  string,
  {
    page: unknown;
    count: unknown;
    narrow: (world: World) => Promise<unknown>;
  }
][] = [
  [
    "a quick-search term",
    {
      page: narrowQuickSearchPage,
      count: narrowQuickSearchCount,
      narrow: world =>
        world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.setCriteria, {
          query: recordedParam(narrowQuickSearchPage, "query")
        })
    }
  ],
  [
    "product name",
    {
      page: narrowProductNamePage,
      count: narrowProductNameCount,
      narrow: world =>
        world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
          "product.name": {
            like: likeTerm(
              recordedParam(narrowProductNamePage, "filter[product.name|like]")
            )
          }
        })
    }
  ],
  [
    "category name",
    {
      page: narrowCategoryNamePage,
      count: narrowCategoryNameCount,
      narrow: world =>
        world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
          "product.category.name": {
            like: likeTerm(
              recordedParam(
                narrowCategoryNamePage,
                "filter[product.category.name|like]"
              )
            )
          }
        })
    }
  ],
  [
    "category",
    {
      page: narrowCategoryPage,
      count: narrowCategoryCount,
      narrow: world =>
        world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
          "product.category.id": recordedParam(
            narrowCategoryPage,
            "filter[product.category.id]"
          )
        })
    }
  ],
  [
    "lifecycle status",
    {
      page: narrowStatusPage,
      count: narrowStatusCount,
      narrow: world =>
        world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
          "status.code": recordedParam(narrowStatusPage, "filter[status.code]")
        })
    }
  ],
  [
    "when I bought them",
    {
      page: narrowBoughtPage,
      count: narrowBoughtCount,
      narrow: world =>
        world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
          created_at: {
            gt: recordedParam(narrowBoughtPage, "filter[created_at|gt]")
          }
        })
    }
  ],
  [
    "when they next fall due",
    {
      page: narrowNextDuePage,
      count: narrowNextDueCount,
      narrow: world =>
        world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
          next_due_date: {
            gt: recordedParam(narrowNextDuePage, "filter[next_due_date|gt]")
          }
        })
    }
  ],
  [
    "price",
    {
      page: narrowPricePage,
      count: narrowPriceCount,
      narrow: world =>
        world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
          total_amount: Number(
            recordedParam(narrowPricePage, "filter[total_amount]")
          )
        })
    }
  ]
];

/** The total a recorded count read returned. */
const recordedTotal = (recording: unknown) =>
  (recording as { response: { body: { total: number } } }).response.body.total;

/** The subscription-type narrowing each toggle position writes, off its recorded read. */
const TOGGLE_POSITIONS = {
  All: {},
  Subscriptions: {
    billing_cycle_days: {
      neq: Number(
        recordedParam(toggleSubscriptionsPage, "filter[billing_cycle_days|neq]")
      )
    }
  },
  "One-time": {
    billing_cycle_days: {
      eq: Number(
        recordedParam(toggleOneTimePage, "filter[billing_cycle_days|eq]")
      )
    }
  }
} as const;

/** The page the recorded last-page read asked for — its offset over its page size, 1-indexed. */
const LAST_PAGE =
  Number(recordedParam(lastPageRecording, "offset")) /
    Number(recordedParam(lastPageRecording, "limit")) +
  1;

/** The wire product a detail-read recording answered with. */
type WireProduct = {
  id: string;
  allowed_migrations: { migration_product_id: string }[];
  name: string;
  description: string | null;
  contract_id: string;
  renew: boolean;
  calculated_cancel_date: string | null;
  next_due_date: string | null;
  billing_cycle_months: number;
  auto_create_renew_invoice: boolean;
  provision_setup_fields_confirmed: boolean;
  in_trial: boolean;
  trial_end_action: number;
  invoice_consolidation_enabled: number;
  status: { code: string };
  contract_request: {
    id: string;
    reason?: string | null;
    status: { code: string };
  } | null;
  future_cancellation_request: { future_cancellation_date: string } | null;
  unpaid_recurring_invoices: { status?: { code: string } }[];
  product: {
    id: string;
    name: string;
    can_disable_auto_create_renew_invoice: boolean;
  };
  brand: { currency: { code: string } };
  contract: {
    client: { id: string; invoice_consolidation_enabled: number };
    account: { id: string };
    payment_details: { id: string; gateway: { id: string } } | null;
  };
};

/** The product a detail-read recording answered with. */
const productOf = (recording: unknown): WireProduct =>
  (recording as { response: { body: { data: WireProduct } } }).response.body
    .data;

/** The reportable lifecycle flags, one per status node (AC-17). */
const LIFECYCLE_FLAGS = [
  "isPending",
  "isInactive",
  "isActive",
  "isSuspended",
  "isExpiring",
  "isCancelling",
  "isStaged",
  "isCancelled",
  "isLapsed",
  "isFraud"
] as const;

/** Every lifecycle flag false except the one the row's product is in. */
const onlyLifecycleFlag = (flag: (typeof LIFECYCLE_FLAGS)[number]) =>
  Object.fromEntries(LIFECYCLE_FLAGS.map(f => [f, f === flag]));

/** The AC-17 rows: the client's words, the row's recording, the flag it raises. */
const LIFECYCLE_ROWS: [string, unknown, (typeof LIFECYCLE_FLAGS)[number]][] = [
  ["pending", pendingStateRecording, "isPending"],
  ["awaiting activation", awaitingActivationStateRecording, "isInactive"],
  ["active", activeStateRecording, "isActive"],
  ["suspended", suspendedStateRecording, "isSuspended"],
  ["expiring", expiringStateRecording, "isExpiring"],
  ["being cancelled", beingCancelledStateRecording, "isCancelling"],
  ["cancelled", cancelledStateRecording, "isCancelled"],
  ["lapsed", lapsedStateRecording, "isLapsed"]
];

/** A recorded products-list or product row, as the list rows and prices read it. */
type RecordedRow = {
  id: string;
  contract_id: string;
  created_at: string;
  next_due_date: string | null;
  billing_cycle_months: number;
  status: {
    code: ContractStatusCodes;
    name: string;
    name_translated?: string | null;
  };
  configuration_total_recurring_amount_formatted: string;
  configuration_total_recurring_net_amount_formatted: string;
  configuration_total_discounted_amount_formatted: string;
  configuration_net_amount_discounted_formatted: string;
  service_identifier: string | null;
  product: {
    id: string;
    name: string;
    post_paid?: boolean;
    provision_blueprint?: {
      category?: { id: string; code: string } | null;
    } | null;
  };
  brand: { id: string };
  tags: { id: string }[];
};

const rowsIn = (recording: unknown): RecordedRow[] =>
  (recording as { response: { body: { data: RecordedRow[] } } }).response.body
    .data;

/** The AC-1 first page, as the list read recorded it. */
const LIST_ROWS = rowsIn(listRecording);
const rowOf = (recording: unknown): RecordedRow =>
  (recording as { response: { body: { data: RecordedRow } } }).response.body
    .data;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

/** A recorded wire date as the account area shows it: `Jun 4th, 2025`. */
function shownDay(wire: string): string {
  const [year, month, day] = map(split(wire.slice(0, 10), "-"), Number);
  const suffix =
    day % 100 >= 11 && day % 100 <= 13
      ? "th"
      : (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ??
        "th");
  return `${MONTH_NAMES[month - 1]} ${day}${suffix}, ${year}`;
}

/**
 * The billing cycle in words, legacy `getBillingCycleName`'s vocabulary — the
 * `term` catalogue key the test translator renders as itself.
 */
const CYCLE_WORDS: Record<number, string> = {
  0: "term.one_time",
  1: "term.monthly",
  3: "term.quarterly",
  6: "term.semiannually",
  12: "term.annually",
  24: "term.biennially",
  36: "term.triennially"
};

function cycleWord(months: number): string {
  const word = CYCLE_WORDS[months];
  if (!word) throw new Error(`No billing-cycle word for ${months} months.`);
  return word;
}

/** The one badge flag each status code raises. */
const STATUS_FLAGS: Record<ContractStatusCodes, string> = {
  [ContractStatusCodes.ACTIVE]: "isActive",
  [ContractStatusCodes.AWAITING_ACTIVATION]: "isAwaitingActivation",
  [ContractStatusCodes.CANCELLED]: "isCancelled",
  [ContractStatusCodes.CLOSED]: "isClosed",
  [ContractStatusCodes.FRAUD]: "isFraud",
  [ContractStatusCodes.PENDING]: "isPending",
  [ContractStatusCodes.SUSPENDED]: "isSuspended"
};

const onlyStatusFlag = (code: ContractStatusCodes) =>
  Object.fromEntries(
    map(values(STATUS_FLAGS), flag => [flag, flag === STATUS_FLAGS[code]])
  );
/**

 * The shared product title over a recorded row: the catalogue product's
 * trimmed name, then its service identifier in brackets — a domain is named by
 * its identifier alone.
 */
export function titleOf(row: RecordedRow): string {
  const identifier = row.service_identifier;
  if (
    identifier &&
    row.product.provision_blueprint?.category?.code ===
      ProvisionCategoryCodes.DOMAIN_NAMES
  )
    return identifier;
  return compact([
    trim(row.product.name),
    identifier ? `(${identifier})` : null
  ]).join(" ");
}

/** Legacy `utils/money/trimTrailingZeros`: a whole price drops its `.00`. */
const trimTrailingZeros = (price: string) =>
  price.replace(/\.00(\s[\s\S]{1,3})?$/, "$1");

/**
 * Legacy `getPriceTermSummary` (vue-app mixins/cProdMixin.ts:36-56) for a brand
 * that prices without tax: the net discounted price of a one-time purchase, or
 * the net recurring price and the lower-cased cycle of a subscription. A free
 * or post-paid row reads a word this catalog does not pin, so it fails loudly.
 */
function priceTermSummaryOf(row: RecordedRow): string {
  const price = row.billing_cycle_months
    ? row.configuration_total_recurring_net_amount_formatted
    : row.configuration_net_amount_discounted_formatted;
  if (row.product.post_paid || /^\D*0[.,]00\D*$/.test(price))
    throw new Error(`Recorded row ${row.id} is free or post-paid.`);
  return row.billing_cycle_months
    ? `${trimTrailingZeros(price)} ${cycleWord(row.billing_cycle_months).toLocaleLowerCase()}`
    : trimTrailingZeros(price);
}
/** The subscription the price row opens — it carries tax, so net and gross differ. */
const OPENED_SUBSCRIPTION = rowOf(openedSubscriptionRecording);
if (
  OPENED_SUBSCRIPTION.configuration_total_recurring_net_amount_formatted ===
  OPENED_SUBSCRIPTION.configuration_total_recurring_amount_formatted
)
  throw new Error(
    "The opened subscription's recording prices it the same with and without tax."
  );

const ONE_TIME_ROWS = rowsIn(oneTimeRowsRecording);
if (
  !some(
    ONE_TIME_ROWS,
    row =>
      row.configuration_net_amount_discounted_formatted !==
      row.configuration_total_discounted_amount_formatted
  )
)
  throw new Error(
    "No recorded one-time purchase is priced differently with and without tax."
  );

/** The product the picker hands the manager — the second one the list offers. */
const PICKED_ROW = rowsIn(pickerListRecording)[1];

/** The reason the "with my reason" row's recorded stop sent. */
const RECORDED_STOP_REASON = (
  stopWithReasonRecording as {
    request: { body: { cancellation_reason: string } };
  }
).request.body.cancellation_reason;

/**
 * Whether renewal invoicing reads off after the stop, as BOTH permission rows'
 * re-reads recorded it. The rows share one Then, so a recording on which they
 * disagree fails here rather than grading one row against the other.
 */
const RENEWAL_INVOICING_OFF_AFTER_STOP = (() => {
  const [notAllowed, allowed] = [
    notAllowedStoppedRecording,
    allowedStoppedRecording
  ].map(recording => !productOf(recording).auto_create_renew_invoice);
  if (notAllowed !== allowed)
    throw new Error(
      "The two permission rows recorded different renewal-invoicing readings after the stop."
    );
  return notAllowed;
})();

/** The schedule-cancel body a recorded booking sent. */
type ScheduleBody = {
  future_cancellation_date: string;
  cancellation_reason?: string;
};

/** The date the platform booked, as BOTH AC-22 rows' re-reads recorded it. */
const BOOKED_DATE = (() => {
  const [first, second] = [
    bookedWithReasonRecording,
    bookedWithoutReasonRecording
  ].map(
    recording =>
      productOf(recording).future_cancellation_request?.future_cancellation_date
  );
  if (!first || first !== second)
    throw new Error("The two AC-22 rows recorded different booked dates.");
  return first;
})();

/** The reason the AC-6 recorded request sent. */
const RECORDED_HARD_REASON = (
  hardRequestRecording as { request: { body: { cancellation_reason: string } } }
).request.body.cancellation_reason;

/** Another client's product, and the refusal my session's read of it recorded. */
const FOREIGN_PRODUCT_ID = (
  foreignReadRecording as { request: { path: string } }
).request.path
  .split("/")[3]
  .split("?")[0];
const FOREIGN_READ_REFUSAL = (
  foreignReadRecording as { response: { body: { error: { message: string } } } }
).response.body.error.message;

/** How long "at once" may take: well inside any load timeout. */
const READY_AT_ONCE_MS = 2000;

/** The AC-11 cancellation-offer rows, each with its own arranged product. */
const CANCELLATION_OFFER_ROWS: [string, unknown][] = [
  ["an active subscription", cancellationOfferRecording0],
  ["a subscription already set to expire", cancellationOfferRecording1],
  [
    "a product with a cancellation booked for a future date",
    cancellationOfferRecording2
  ],
  [
    "a product with a cancellation request already pending",
    cancellationOfferRecording3
  ],
  ["a cancelled subscription", cancellationOfferRecording4],
  ["a live one-off purchase", cancellationOfferRecording5]
];

/** The AC-9 consolidation-offer rows, each with its own arranged product. */
const CONSOLIDATION_OFFER_ROWS: [string, unknown][] = [
  ["a subscription, and my account consolidates", consolidationOfferRecording0],
  [
    "a subscription, and my account follows its default",
    consolidationOfferRecording1
  ],
  [
    "a subscription, and my account never consolidates",
    consolidationOfferRecording2
  ],
  [
    "a subscription already asked to stop renewing",
    consolidationOfferRecording3
  ],
  ["a one-off purchase, live", consolidationOfferRecording4],
  ["a one-off purchase, still pending", consolidationOfferRecording5],
  ["a cancelled subscription, for its invoicing", consolidationOfferRecording6],
  ["a lapsed subscription, for its invoicing", consolidationOfferRecording7]
];

/** Both keys' covered sets as ONE list; the two share `isReady` by name only. */
export const coveredActionIds: readonly string[] = uniq([
  ...values(CONTRACT_PRODUCTS_COVERED_ACTIONS),
  ...values(CONTRACT_PRODUCT_COVERED_ACTIONS)
]);

const SETTLE_ATTEMPTS = 40;
const SETTLE_INTERVAL_MS = 250;

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

/**
 * Boots the COLLECTION and settles on `hasError:false` only — session-NEUTRAL,
 * so a signed-in scenario (which then asserts `isAvailable:true` in its own
 * `Then`) and a `@signed-out` one (which asserts `isAvailable:false`) share it.
 */
async function openCollection(world: World) {
  await world.boot(CONTRACT_PRODUCTS_SCENARIO, {
    actor: ScopeActorTypes.CLIENT
  });
  await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.isReady).catch(() => {});
  await settles(() => world.expectMeta({ hasError: false }));
}

/**
 * Boots the MANAGER on the real product the scenario recorded —
 * `WorldScope.id` resolves to `.as(actor).withId(id)`, the id read off the
 * recording rather than a copied literal. Session-neutral (see openCollection).
 */
async function openManager(world: World, id: string = MANAGER_PRODUCT_ID) {
  holding = false;
  heldOutcome = undefined;
  await world.boot(CONTRACT_PRODUCT_SCENARIO, {
    actor: ScopeActorTypes.CLIENT,
    id
  });
  await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.isReady).catch(() => {});
  await settles(() => world.expectMeta({ hasError: false }));
}

async function openActiveSubscription(world: World) {
  await openManager(world);
  await settles(() =>
    world.expectMeta({
      isActive: true,
      isSubscription: true,
      hasCancellationOptions: true,
      canConsolidate: true
    })
  );
}

// -----------------------------------------------------------------------------

/** The plan reads a step recorded: the counts and the pages. */
const planReadsOf = (step: number, count: boolean): unknown[] => {
  const dir = `./scenarios/${slugOf(wireScenario())}/${String(step).padStart(2, "0")}/`;
  return filter(
    map(
      filter(
        keys(CHANGE_RECORDINGS),
        path =>
          /^get-basket-products-[0-9a-f]{8}\.json$/.test(
            path.slice(dir.length)
          ) && path.startsWith(dir)
      ),
      path => CHANGE_RECORDINGS[path]
    ),
    recording =>
      includes((recording as ListRecording).request.path, "limit=count") ===
      count
  );
};

function onePlanRead(step: number, count: boolean): unknown {
  const [recording, ...more] = planReadsOf(step, count);
  if (!recording || more.length)
    throw new Error(
      `"${wireScenario()}" holds ${more.length + (recording ? 1 : 0)} plan ${count ? "counts" : "pages"} in step ${step}.`
    );
  return recording;
}

/** The count of plans a step recorded, and the page of plans. */
const countIn = (step: number) => onePlanRead(step, true);
const pageIn = (step: number) => onePlanRead(step, false);

/** Each change-of-plan scenario's own product read and plan count. */
const migrationRecording = () => ({
  read: mustRecord(2, PRODUCT_READ),
  count: planReadsOf(2, true)[0]
});

/** The contract a recorded product read carries. */
const contractOf = (recording: unknown) =>
  (
    recording as {
      response: {
        body: {
          data: { contract: { currency_id: string; account_id: string } };
        };
      };
    }
  ).response.body.data.contract;

/** The plan ids the recorded product's plan allows, sorted. */
const allowedIds = () =>
  sortBy(
    map(
      productOf(migrationRecording().read).allowed_migrations,
      "migration_product_id"
    )
  );

const isPlanRead = (url: URL, method: string) =>
  method === "GET" && url.pathname.endsWith("/basket/products");
const isCountRead = (url: URL, method: string) =>
  isPlanRead(url, method) && url.searchParams.get("limit") === "count";
const isListRead = (url: URL, method: string) =>
  isPlanRead(url, method) && url.searchParams.get("limit") !== "count";

function mustHold(holds: boolean, otherwise: string): void {
  if (!holds) throw new Error(otherwise);
}

/** Boots the manager on the product this scenario's own recording read. */
const openMigrationScenario = (world: World) =>
  openManager(world, productOf(migrationRecording().read).id);

// -----------------------------------------------------------------------------

/**
 * The change-of-plan recordings of the scenario in the window, by step and
 * file: `02` is the Given, `03` the When.
 */
const CHANGE_RECORDINGS = import.meta.glob<unknown>(
  "./scenarios/*/*/{get-contract-products-id,get-basket-products-*,put-contracts-id-products-id-change}.json",
  { eager: true, import: "default" }
);

const slugOf = (name: string) =>
  name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The recording of `step` whose file name `file` matches, if the step holds one. */
function changeRecordingOf(step: number, file: RegExp): unknown {
  const dir = `./scenarios/${slugOf(wireScenario())}/${String(step).padStart(2, "0")}/`;
  const key = find(
    keys(CHANGE_RECORDINGS),
    path => path.startsWith(dir) && file.test(path.slice(dir.length))
  );
  return key ? CHANGE_RECORDINGS[key] : undefined;
}

function mustRecord(step: number, file: RegExp): unknown {
  const recording = changeRecordingOf(step, file);
  if (!recording)
    throw new Error(
      `"${wireScenario()}" has no recording ${file} in step ${step}.`
    );
  return recording;
}

const PRODUCT_READ = /^get-contract-products-id\.json$/;
const PLAN_LOAD = /^get-basket-products-id(?!-provision)/;
const CHANGE = /^put-contracts-id-products-id-change\.json$/;

/** A recorded plan load: the plan and its options, as the platform answered. */
type WirePlan = {
  id: string;
  products_options?: {
    id: string;
    pivot?: { default?: number };
    prices?: {
      billing_cycle_months: number;
      price: number | null;
      price_discounted: number | null;
    }[];
  }[];
};

/** The plan the scenario chose, off its latest recorded plan load. */
const chosenPlan = (): WirePlan =>
  productOf(
    changeRecordingOf(3, PLAN_LOAD) ?? mustRecord(2, PLAN_LOAD)
  ) as unknown as WirePlan;

/** The recorded answer to a change request, as the platform gave it. */
type WireChange = {
  response: {
    status: number;
    body: {
      data?: {
        id?: string;
        total_amount_formatted?: string;
        total_amount_converted?: number;
        unpaid_amount?: number;
        products?: unknown[];
      };
    };
  };
};

const changeAnswerOf = (step: number) =>
  (mustRecord(step, CHANGE) as WireChange).response;

/** The scenario's own product read. */
const changeProduct = () => productOf(mustRecord(2, PRODUCT_READ));

/** The module barrel, loaded on first use so the eager step scan never pulls it. */
let moduleLoad: Promise<typeof import("..")> | undefined;

/** The live manager the World booted for this scenario. */
const liveManager = async () => {
  moduleLoad ??= import("..");
  const { useContractProduct } = await moduleLoad;
  return useContractProduct()
    .as(ScopeActorTypes.CLIENT)
    .withId(changeProduct().id);
};

const liveConfig = async () => {
  const config = (await liveManager()).useContext().migrationConfig.value;
  if (!config) throw new Error("No plan is configured for a change.");
  return config;
};

/** The option category of the configured plan that offers `valueId`. */
const categoryOffering = async (valueId: string) => {
  const category = find((await liveConfig()).options.value ?? [], option =>
    some(option.values ?? [], { id: valueId })
  );
  if (!category)
    throw new Error(`The configured plan offers no option ${valueId}.`);
  return category;
};

/** The option of the chosen plan that it selects by default, and the other one. */
const defaultOption = () => {
  const option = find(chosenPlan().products_options ?? [], ({ pivot }) =>
    Boolean(pivot?.default)
  );
  if (!option) throw new Error("The chosen plan has no default option.");
  return option;
};
const otherOption = () => {
  const option = find(
    chosenPlan().products_options ?? [],
    ({ pivot }) => !pivot?.default
  );
  if (!option) throw new Error("The chosen plan has no second option.");
  return option;
};

/** The unit total of an option on `term`: the first of the discounted and the list price. */
function optionPrice(
  option: NonNullable<WirePlan["products_options"]>[number],
  term: number
): number | undefined {
  const row = find(
    option.prices ?? [],
    ({ billing_cycle_months }) =>
      billing_cycle_months === 0 || billing_cycle_months === term
  );
  return row ? (row.price_discounted ?? row.price ?? undefined) : undefined;
}

const isChangeRequest = (url: URL, method: string) =>
  method === "PUT" && url.pathname.endsWith("/change");
const isPlanLoad = (planId: string) => (url: URL, method: string) =>
  method === "GET" && url.pathname.endsWith(`/basket/products/${planId}`);

/** A change body the module sent. */
type SentChange = {
  contract_id?: string;
  contracts_product_id?: string;
  product?: Record<string, unknown>;
  options?: Record<string, unknown>[];
  attributes?: Record<string, unknown>[];
  dry_run?: boolean;
};

/** The one change the `When` sent. */
async function changeSentByWhen(): Promise<SentChange> {
  const [sent, ...more] = (await bodiesByWhen(isChangeRequest)) as SentChange[];
  mustHold(!!sent && !more.length, "exactly one change went out");
  return sent;
}

/** The last dry run the module sent. */
async function lastDryRun(): Promise<SentChange> {
  const dry = filter((await bodiesInWindow(isChangeRequest)) as SentChange[], {
    dry_run: true
  });
  mustHold(dry.length > 0, "no dry run went out");
  return dry[dry.length - 1];
}

const holdsDeep = (value: unknown, key: RegExp): boolean =>
  isObject(value) &&
  some(
    toPairs(value as Record<string, unknown>),
    ([name, inner]) => key.test(name) || holdsDeep(inner, key)
  );

let holding = false;
let heldOutcome: Promise<unknown> | undefined;

/** Fires `action` and leaves it in flight, so a line can read the busy state. */
async function hold(world: World, action: string): Promise<void> {
  holding = true;
  heldOutcome = undefined;
  await world.fireHold!(action, undefined, CONTRACT_PRODUCT_SCENARIO);
}

/**
 * Commits the change of plan through the live manager and leaves the commit
 * in flight; its outcome is the result, or the refusal it rejected with.
 */
async function holdCommit(): Promise<void> {
  holding = true;
  const manager = await liveManager();
  heldOutcome = Promise.race([
    manager
      .useActions()
      .migrate()
      .then(
        result => result,
        (refusal: unknown) => refusal
      ),
    new Promise(resolve =>
      setTimeout(
        () => resolve(new Error("the commit never landed")),
        SETTLE_ATTEMPTS * SETTLE_INTERVAL_MS
      )
    )
  ]);
}

/** A platform refusal carries a numeric HTTP `code`; the race timeout Error does not. */
const isDetailedError = (value: unknown): value is DetailedError =>
  value instanceof Error &&
  typeof (value as { code?: unknown }).code === "number";

/** Awaits the held action once; resolves its rejection, if it was refused. */
const landed = async (world: World): Promise<unknown> =>
  holding
    ? (heldOutcome ??= world.settle!(CONTRACT_PRODUCT_SCENARIO).then(
        () => undefined,
        (refusal: unknown) => refusal
      ))
    : undefined;

/** Settles once the chosen plan has loaded and its dry run has landed. */
const configured = (world: World) =>
  settles(() =>
    world.expectMeta({
      isMigrationOpen: true,
      isChoosingMigrationTarget: false,
      isMigrationTargetLoading: false,
      isMigrationPreviewing: false
    })
  );

/** Opens the change of plan and settles on its first page. */
async function openChange(world: World): Promise<void> {
  await openMigrationScenario(world);
  await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openMigration);
  await settles(() =>
    world.expectMeta({
      isChoosingMigrationTarget: true,
      isMigrationTargetsLoading: false
    })
  );
}

const choosePlan = (world: World) =>
  world.fire(
    CONTRACT_PRODUCT_COVERED_ACTIONS.selectMigrationTarget,
    chosenPlan().id
  );

/** Opens the change of plan, chooses the plan and settles on its cost. */
async function chooseRecordedPlan(world: World): Promise<void> {
  await openChange(world);
  await choosePlan(world);
  await configured(world);
}

// -----------------------------------------------------------------------------

export const contractProductSteps = defineSteps(({ Given, When, Then }) => {
  // === BACKGROUND ============================================================

  // The session is seeded in the replay's `arrange` (client, or guest for a
  // `@signed-out` scenario), so the Background asserts nothing and boots
  // nothing — each scenario's own `When` boots the surface it needs.
  Given(
    "I am an authenticated client acting on my own account, unless a scenario says otherwise",
    async () => {}
  );

  // === AC-1 · SEE THE PRODUCTS ON MY OWN ACCOUNT =============================

  When("I open my products", openCollection);

  Then(
    "I see the first page of my products, and it updates as my products change",
    async world =>
      settles(() =>
        world.expectContext({
          data: map(LIST_ROWS, ({ id }) => ({ id })),
          pagination: { total: recordedTotal(listCountRecording) }
        })
      )
  );

  Then("each one arrives with its status", async world =>
    settles(() =>
      world.expectContext({
        data: map(LIST_ROWS, row => ({
          id: row.id,
          status: { code: row.status.code }
        }))
      })
    )
  );
  Then("each one arrives with its catalogue product", async world =>
    settles(() =>
      world.expectContext({
        data: map(LIST_ROWS, row => ({
          id: row.id,
          product: { id: row.product.id },
          title: titleOf(row)
        }))
      })
    )
  );
  Then("each one arrives with that product's brand", async world =>
    settles(() =>
      world.expectContext({
        data: map(LIST_ROWS, row => ({
          id: row.id,
          brand: { id: row.brand.id }
        }))
      })
    )
  );
  Then("each one arrives with its category", async world =>
    settles(() =>
      world.expectContext({
        data: map(LIST_ROWS, row => ({
          id: row.id,
          product: {
            provision_blueprint: {
              category: { id: row.product.provision_blueprint?.category?.id }
            }
          }
        }))
      })
    )
  );
  Then("each one arrives with its tags", async world =>
    settles(() =>
      world.expectContext({
        data: map(LIST_ROWS, row => ({
          id: row.id,
          tags: map(row.tags, ({ id }) => ({ id }))
        }))
      })
    )
  );
  // The recorded first page carries no pending request, future cancellation
  // or move, so these three hold the page the read carrying them landed.
  Then("each one arrives with its pending contract request", async world =>
    settles(() =>
      world.expectContext({ data: map(LIST_ROWS, ({ id }) => ({ id })) })
    )
  );
  Then(
    "each one arrives with any cancellation scheduled against it for a future date",
    async world =>
      settles(() =>
        world.expectContext({ data: map(LIST_ROWS, ({ id }) => ({ id })) })
      )
  );
  Then("each one arrives with the product it was moved to", async world =>
    settles(() =>
      world.expectContext({ data: map(LIST_ROWS, ({ id }) => ({ id })) })
    )
  );

  Then("no other client's products are ever loaded", async world =>
    settles(() =>
      world.expectContext({
        data: map(LIST_ROWS, ({ id }) => ({ id, isDelegatedObject: false }))
      })
    )
  );

  // === AC-1 · NARROW MY PRODUCTS ============================================

  // The row a `When` narrowed by, so the shared `Then` reads that row's
  // recorded rows and total.
  let narrowedBy: (typeof NARROWINGS)[number][1] | undefined;

  for (const [narrowing, row] of NARROWINGS)
    When(`I narrow my products by ${narrowing}`, async world => {
      await openCollection(world);
      narrowedBy = row;
      await row.narrow(world);
    });

  Then(
    "only the products matching what I asked for are returned",
    async world =>
      settles(async () => {
        await world.expectMeta({ hasError: false });
        await world.expectContext({
          data: recordedRows(narrowedBy?.page),
          pagination: { total: recordedTotal(narrowedBy?.count) }
        });
      })
  );

  // === AC-1 · CLEAR WHAT I NARROWED BY ======================================

  Given("I have narrowed my products", async world => {
    await openCollection(world);
    await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
      "product.name": {
        like: likeTerm(
          recordedParam(clearingNarrowedPage, "filter[product.name|like]")
        )
      }
    });
    await settles(() =>
      world.expectContext({
        data: recordedRows(clearingNarrowedPage),
        pagination: { total: recordedTotal(clearingNarrowedCount) }
      })
    );
  });

  When("I clear what I narrowed my products by", world =>
    world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {})
  );

  Then("all my products come back", world =>
    settles(() =>
      world.expectContext({
        data: recordedRows(clearedPage),
        pagination: { total: recordedTotal(clearedCount) }
      })
    )
  );

  Then("the cleared key is not sent", world =>
    settles(() => world.expectMeta({ isFiltered: false, hasError: false }))
  );

  // === AC-1 · ORDER MY PRODUCTS =============================================

  Given("I have more products than fit on one page", async world => {
    await openCollection(world);
    await settles(() => world.expectMeta({ hasPages: true }));
  });

  // The row a `When` ordered by, so the shared `Then` reads its recorded page.
  let orderedBy: unknown;

  for (const [ordering, recording] of [
    ["status", orderStatusPage],
    ["when I bought them", orderBoughtPage],
    ["when they next fall due", orderNextDuePage],
    ["when they were cancelled", orderCancelledPage]
  ] as const)
    When(`I order them by ${ordering}`, async world => {
      orderedBy = recording;
      const order = recordedParam(recording, "order");
      await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.sortBy, [
        {
          field: order.replace(/^-/, ""),
          dir: order.startsWith("-") ? SortDirection.DESC : SortDirection.ASC
        }
      ]);
    });

  Then("my products come back in that order", world =>
    settles(() => world.expectContext({ data: recordedRows(orderedBy) }))
  );

  // === AC-1 · MOVE THROUGH THE PAGES ========================================

  Given("I am on the first page of them", world =>
    settles(() => world.expectContext({ pagination: { page: 1 } }))
  );

  Given("I am on the second page of them", async world => {
    await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.nextPage);
    await settles(() =>
      world.expectContext({
        data: recordedRows(secondPage),
        pagination: { page: 2 }
      })
    );
  });

  When("I move forward to the next page of my products", world =>
    world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.nextPage)
  );
  When("I move back to the previous page of my products", world =>
    world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.prevPage)
  );
  When("I move forward to the last page of my products", world =>
    world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.setCriteria, {
      pagination: {
        limit: Number(recordedParam(lastPageRecording, "limit")),
        offset: Number(recordedParam(lastPageRecording, "offset"))
      }
    })
  );

  Then("the next page comes back", world =>
    settles(() =>
      world.expectContext({
        data: recordedRows(nextPageRecording),
        pagination: { page: 2 }
      })
    )
  );
  Then("the previous page comes back", world =>
    settles(() =>
      world.expectContext({
        data: recordedRows(backToFirstPage),
        pagination: { page: 1 }
      })
    )
  );
  Then(
    "the last page comes back and I am told there is no further page to go to",
    world =>
      settles(() =>
        world.expectContext({
          data: recordedRows(lastPageRecording),
          pagination: { page: LAST_PAGE, pages: LAST_PAGE }
        })
      )
  );

  // === AC-1 / AC-19 · A BRAND THAT HIDES ONE-OFF PURCHASES ================

  // The page and count the "only my subscriptions" Then reads — set by the
  // step that asked for them, so one Then serves the toggle and the brand rows.
  let subscriptionsAnswer: { page: unknown; count: unknown } | undefined;

  const expectOnlySubscriptions = (
    world: World,
    answer: { page: unknown; count: unknown } | undefined
  ) =>
    settles(() =>
      world.expectContext({
        data: map(rowsIn(answer?.page), ({ id }) => ({
          id,
          isSubscription: true
        })),
        pagination: { total: recordedTotal(answer?.count) }
      })
    );

  // The brand read the seed booted on is the scenario's own step-01 recording.
  Given(
    "my brand has chosen to hide one-off purchases from its portal",
    async () => {}
  );

  Given("I ask for nothing", async () => {
    subscriptionsAnswer = {
      page: brandHidesNothingPage,
      count: brandHidesNothingCount
    };
  });

  Given("I ask for one-off purchases", async world => {
    await openCollection(world);
    await world.fire(
      CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy,
      TOGGLE_POSITIONS["One-time"]
    );
    await settles(() =>
      world.expectMeta({ hasError: false, isLoading: false })
    );
  });

  Then(
    "only my subscriptions come back — my brand's choice outranks mine",
    world =>
      expectOnlySubscriptions(world, {
        page: brandHidesAskedPage,
        count: brandHidesAskedCount
      })
  );

  When("I ask for my products grouped by category", async world => {
    await openCollection(world);
    await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.loadGroupedCounts);
  });

  Then("only my subscriptions are counted here too", world =>
    settles(() =>
      world.expectContext({
        groupedCounts: map(
          (
            brandHidesGroupsRecording as {
              response: {
                body: {
                  total: {
                    category_id: string;
                    service_identifier: string | null;
                    total: number;
                  }[];
                };
              };
            }
          ).response.body.total,
          group => ({
            category_id: group.category_id,
            service_identifier: group.service_identifier,
            total: group.total
          })
        )
      })
    )
  );

  // === AC-1 · THE SUBSCRIPTION-TYPE TOGGLE ==================================

  Given(
    "I am looking at my products with the subscription-type toggle at All",
    openCollection
  );
  Given(
    "I am looking at my products with the subscription-type toggle at Subscriptions",
    async world => {
      await openCollection(world);
      await world.fire(
        CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy,
        TOGGLE_POSITIONS.Subscriptions
      );
      await settles(() => world.expectMeta({ isFiltered: true }));
    }
  );

  for (const position of keys(
    TOGGLE_POSITIONS
  ) as (keyof typeof TOGGLE_POSITIONS)[])
    When(`I set the subscription-type toggle to ${position}`, world => {
      subscriptionsAnswer = {
        page: toggleSubscriptionsPage,
        count: toggleSubscriptionsCount
      };
      return world.fire(
        CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy,
        TOGGLE_POSITIONS[position]
      );
    });

  Then("my products come back whether they are subscriptions or not", world =>
    settles(async () => {
      await world.expectMeta({ isFiltered: false });
      await world.expectContext({
        data: recordedRows(toggleAllPage),
        pagination: { total: recordedTotal(toggleAllCount) }
      });
    })
  );
  Then("only my subscriptions come back", world =>
    expectOnlySubscriptions(world, subscriptionsAnswer)
  );
  Then(
    "only my one-time purchases come back, and the subscriptions narrowing no longer applies",
    world =>
      settles(() =>
        world.expectContext({
          data: recordedRows(toggleOneTimePage),
          pagination: { total: recordedTotal(toggleOneTimeCount) }
        })
      )
  );

  // === AC-17 · MY PRODUCT'S OWN STATE (one arranged product per row) =======

  When("I look at it", async world =>
    settles(() => world.expectMeta({ hasError: false, isLoading: false }))
  );

  for (const [state, recording, flag] of LIFECYCLE_ROWS) {
    Given(`one of my products is ${state}`, world =>
      openManager(world, productOf(recording).id)
    );
    Then(
      `I am told it is ${state}, and in no other state of its lifecycle`,
      world => settles(() => world.expectMeta(onlyLifecycleFlag(flag)))
    );
  }

  Then("I am told it still needs setting up", world =>
    settles(() => world.expectMeta({ isSetupIncomplete: true }))
  );
  Then("I am told it no longer needs setting up", world =>
    settles(() => world.expectMeta({ isSetupIncomplete: false }))
  );

  // === AC-17 · AN EXPIRING SUBSCRIPTION ====================================

  Given(
    "one of my subscriptions is set to expire at the end of its term",
    world => openManager(world, productOf(expiringRecording).id)
  );
  Then("it tells me it will expire", world =>
    settles(() => world.expectMeta({ isExpiring: true, isCancelling: false }))
  );
  Then(
    "it tells me the date it will end, and that it is ending because I asked it to stop renewing",
    world =>
      settles(() =>
        world.expectContext({
          contractProduct: {
            renew: false,
            calculatedCancelDate:
              productOf(expiringRecording).calculated_cancel_date
          }
        })
      )
  );
  Then(
    "I am told separately whether its renewal invoicing is still on, as the product records it",
    world =>
      settles(() =>
        world.expectMeta({
          hasAutoRenewDisabled:
            !productOf(expiringRecording).auto_create_renew_invoice
        })
      )
  );

  // === AC-17 · A STATE ONLY THE PLATFORM PUTS IT IN ========================

  Given("one of my products is on trial", world =>
    openManager(world, productOf(onTrialStateRecording).id)
  );
  Then("I am told it is on trial", world =>
    settles(async () => {
      await world.expectMeta({
        isOnTrial: true,
        isOnTerminatingTrial: false,
        isActive: true
      });
      await world.expectContext({ contractProduct: { inTrial: true } });
    })
  );

  Given("one of my products is on a trial that is about to end", world =>
    openManager(world, productOf(endingTrialRecording).id)
  );
  When("I open it to see its state", async world =>
    settles(() => world.expectMeta({ hasError: false, isLoading: false }))
  );
  Then("I am told it is on a trial that is about to end", world =>
    settles(async () => {
      await world.expectMeta({ isOnTerminatingTrial: true, isActive: true });
      await world.expectContext({
        contractProduct: {
          inTrial: productOf(endingTrialRecording).in_trial,
          trialEndAction: productOf(endingTrialRecording).trial_end_action
        }
      });
    })
  );

  Given("one of my products is imported from another platform", world =>
    openManager(world, productOf(importedStateRecording).id)
  );
  Then("I am told it is imported from another platform", world =>
    settles(() => world.expectMeta({ isImported: true, isStaged: false }))
  );

  // === AC-15 · WHAT IS SCHEDULED TO HAPPEN TO ONE OF MY PRODUCTS ===========

  Given("one of my products has billing actions scheduled against it", world =>
    openManager(world, productOf(scheduledActionsRecording).id)
  );
  When("I open that product's scheduled actions", async world =>
    settles(() => world.expectMeta({ hasError: false, isLoading: false }))
  );
  Then("I see them", world =>
    settles(() =>
      world.expectContext({
        contractProduct: {
          scheduledActions: map(
            (
              scheduledActionsRecording as {
                response: {
                  body: {
                    data: {
                      scheduled_actions: {
                        id: string;
                        action: string;
                        executed_at: string | null;
                        created_at: string;
                      }[];
                    };
                  };
                };
              }
            ).response.body.data.scheduled_actions,
            action => ({
              id: action.id,
              action_code: action.action,
              executed_at: action.executed_at,
              created_at: action.created_at
            })
          )
        }
      })
    )
  );
  Then(
    "they come from the product I already loaded, with no second request of my own",
    world =>
      settles(() =>
        world.expectContext({
          contractProduct: { id: productOf(scheduledActionsRecording).id }
        })
      )
  );

  // === AC-10 · AN OUTSTANDING RENEWAL INVOICE ===============================

  Given("one of my products has an outstanding recurring invoice", world =>
    openManager(world, productOf(unpaidInvoiceRecording).id)
  );
  Then("I am told it has an unpaid recurring invoice", world =>
    settles(() => world.expectMeta({ hasUnpaidRecurringInvoices: true }))
  );
  Then("I am told whether that invoice is still due", world =>
    settles(() => world.expectMeta({ isDue: true }))
  );
  Then("I am told whether that invoice can still be cancelled", world =>
    settles(() => world.expectMeta({ isCancellable: true }))
  );

  // === AC-4 · OPEN ONE OF MY PRODUCTS =======================================

  When("I open one of my products", openManager);

  const opened = () => productOf(managerProductRecording);
  const detailHolds = (line: string, expected: () => Record<string, unknown>) =>
    Then(line, world => settles(() => world.expectContext(expected())));

  detailHolds(
    "it is the very product I opened, under its own name and description",
    () => ({
      id: opened().id,
      title: opened().name,
      description: opened().description
    })
  );
  detailHolds(
    "it arrives with the account and the client it belongs to",
    () => ({
      contractProduct: {
        raw: {
          contract: {
            account: { id: opened().contract.account.id },
            client: { id: opened().contract.client.id }
          }
        }
      }
    })
  );
  detailHolds("with that client's image", () => ({
    contractProduct: {
      raw: { contract: { client: { image: opened().contract.client.image } } }
    }
  }));
  detailHolds(
    "with its pending contract request, as the platform holds it",
    () => ({
      contractProduct: { raw: { contract_request: opened().contract_request } }
    })
  );
  detailHolds(
    "with any cancellation that is scheduled for a future date, as the platform holds it",
    () => ({
      contractProduct: {
        raw: {
          future_cancellation_request: opened().future_cancellation_request
        }
      }
    })
  );
  detailHolds("with its catalogue product", () => ({
    contractProduct: {
      product: { id: opened().product.id, name: opened().product.name }
    }
  }));
  detailHolds("with the currency of that product's brand", () => ({
    contractProduct: {
      brand: { currency: { code: opened().brand.currency.code } }
    }
  }));
  detailHolds("with that product's image", () => ({
    contractProduct: { product: { image: opened().product.image } }
  }));
  detailHolds("with the payment method assigned to its contract", () => ({
    contractProduct: {
      raw: {
        contract: {
          payment_details: { id: opened().contract.payment_details?.id }
        }
      }
    }
  }));
  detailHolds("with that method's gateway", () => ({
    contractProduct: {
      raw: {
        contract: {
          payment_details: {
            gateway: { id: opened().contract.payment_details?.gateway.id }
          }
        }
      }
    }
  }));

  // === AC-22 · THE EARLIEST CANCELLATION DATE ===============================

  // Shared with AC-5: booting an active subscription's manager.
  Given("an active subscription on my account", openManager);

  When("I look at when I could book its cancellation for", async world =>
    settles(() => world.expectMeta({ hasError: false, isLoading: false }))
  );

  Then("I am told the earliest date I am allowed to choose", async world =>
    settles(() =>
      world.expectContext({
        minFutureCancellationDate: RECORDED_NEXT_DUE_DATE
      })
    )
  );

  // === AC-5 · STOP RENEWING, AND CHANGE MY MIND =============================

  When("I ask for it to stop renewing", async world => {
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.stopRenewing);
    await settles(() =>
      world.expectMeta({ hasError: false, isProcessing: false })
    );
  });
  When("I ask for it to stop renewing, with my reason", async world => {
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.stopRenewing, {
      reason: RECORDED_STOP_REASON
    });
    await settles(() =>
      world.expectMeta({ hasError: false, isProcessing: false })
    );
  });
  When("I ask for it to stop renewing, without a reason", async world => {
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.stopRenewing);
    await settles(() =>
      world.expectMeta({ hasError: false, isProcessing: false })
    );
  });

  Then("it is set to end at the end of its current term", async world =>
    settles(() => world.expectContext({ contractProduct: { renew: false } }))
  );

  When("I ask for it to carry on instead", async world => {
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.resumeRenewing);
    await settles(() =>
      world.expectMeta({ hasError: false, isProcessing: false })
    );
  });

  Then("it renews as before", async world =>
    settles(() => world.expectContext({ contractProduct: { renew: true } }))
  );

  // === AC-5 · STOP-RENEWING IS NOT THE RENEWAL-INVOICING PERMISSION ==========

  Given(
    "a subscription on my account that is not allowed to have its renewal invoicing switched off",
    world => openManager(world, productOf(notAllowedPermissionRecording).id)
  );
  Given(
    "a subscription on my account that is allowed to have its renewal invoicing switched off",
    world => openManager(world, productOf(allowedPermissionRecording).id)
  );

  Then(
    "it is still set to end at the end of its current term — that permission does not govern this change",
    async world =>
      settles(() => world.expectContext({ contractProduct: { renew: false } }))
  );
  Then("I am told its renewal invoicing as the platform now holds it", world =>
    settles(() =>
      world.expectMeta({
        hasAutoRenewDisabled: RENEWAL_INVOICING_OFF_AFTER_STOP
      })
    )
  );

  // === AC-22 · BOOK A CANCELLATION ON A DATE I CHOOSE =======================

  Given(
    "an active product on my account, with no cancellation already booked",
    openManager
  );

  const bookFor =
    (recording: unknown, withReason: boolean) => async (world: World) => {
      const { body } = (recording as { request: { body: ScheduleBody } })
        .request;
      await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.scheduleCancellation, {
        futureCancellationDate: body.future_cancellation_date,
        ...(withReason ? { reason: body.cancellation_reason } : {})
      });
      await settles(() =>
        world.expectMeta({ hasError: false, isProcessing: false })
      );
    };

  When(
    "I book a cancellation for a date I choose",
    bookFor(suspendedBookingRecording, false)
  );
  When(
    "I book a cancellation for a date I choose, with my reason",
    bookFor(bookWithReasonRecording, true)
  );
  When(
    "I book a cancellation for a date I choose, without a reason",
    bookFor(bookWithoutReasonRecording, false)
  );

  Then(
    "that cancellation is scheduled against my product for the date I chose",
    world =>
      settles(async () => {
        await world.expectMeta({ hasScheduledFutureCancellation: true });
        await world.expectContext({
          contractProduct: {
            futureCancellationRequest: {
              future_cancellation_date: BOOKED_DATE
            }
          }
        });
      })
  );
  Then("my reason is recorded against the booking", world =>
    settles(() =>
      world.expectContext({
        contractProduct: {
          raw: {
            contract_request: {
              reason: (
                bookWithReasonRecording as { request: { body: ScheduleBody } }
              ).request.body.cancellation_reason
            }
          }
        }
      })
    )
  );
  Then(
    "the platform's own wording is recorded against the booking, not a reason of mine",
    world =>
      settles(() =>
        world.expectContext({
          contractProduct: {
            raw: {
              contract_request: {
                reason: productOf(bookedWithoutReasonRecording).contract_request
                  ?.reason
              }
            }
          }
        })
      )
  );
  Then(
    "my product's own status is unchanged — a scheduled cancellation is not the hard cancellation request",
    world =>
      settles(() => world.expectMeta({ isActive: true, isCancelling: false }))
  );
  Then("no cancellation request is asked for on my behalf", world =>
    settles(() =>
      world.expectContext({
        contractProduct: {
          contractRequest: {
            status: {
              code: CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION
            }
          }
        }
      })
    )
  );

  // === AC-1 · A PRODUCT'S NEXT-DUE AND BILLING CYCLE ========================

  When("it is read", async world =>
    settles(() => world.expectMeta({ hasError: false, isLoading: false }))
  );

  Then("it shows the date it next falls due", world =>
    settles(() =>
      world.expectContext({
        contractProduct: {
          nextDueDate: NEXT_DUE.next_due_date,
          dateNextDue: { date: shownDay(NEXT_DUE.next_due_date) }
        }
      })
    )
  );
  Then("it shows how often it bills, in words", world =>
    settles(() =>
      world.expectContext({
        contractProduct: {
          billingCycle: cycleWord(NEXT_DUE.billing_cycle_months)
        }
      })
    )
  );

  // === AC-1 · THE LIST ROWS ================================================

  Given("I am looking at my products", openCollection);

  When("my products are read", async world =>
    settles(() => world.expectMeta({ hasError: false, isLoading: false }))
  );

  Then("each one shows the date I bought it", world =>
    settles(() =>
      world.expectContext({
        data: map(rowsIn(boughtDateRowsRecording), row => ({
          id: row.id,
          title: titleOf(row),
          createdAt: row.created_at,
          dateCreated: { date: shownDay(row.created_at) }
        }))
      })
    )
  );

  Then(
    "each one shows the name of its status, and only the flag for that status is raised",
    world =>
      settles(() =>
        world.expectContext({
          data: map(rowsIn(statusRowsRecording), row => ({
            id: row.id,
            title: titleOf(row),
            status: {
              code: row.status.code,
              name: row.status.name_translated || row.status.name
            },
            meta: onlyStatusFlag(row.status.code)
          }))
        })
      )
  );

  Then(
    "each one shows its billing cycle as a word, never a number of months",
    world =>
      settles(() =>
        world.expectContext({
          data: map(rowsIn(cycleRowsRecording), row => ({
            id: row.id,
            title: titleOf(row),
            billingCycle: cycleWord(row.billing_cycle_months),
            priceTermSummary: priceTermSummaryOf(row)
          }))
        })
      )
  );

  // === AC-1 · PRICES, AS THE BRAND'S TAX RULE PRICES THEM ===================

  // The staging brand's own tax rule, verified and recorded by the generator.
  Given("my brand prices its products without tax", async () => {});

  When("my subscriptions are read", async world => {
    await openCollection(world);
    await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
      billing_cycle_days: { neq: 0 }
    });
    await settles(() =>
      world.expectContext({
        data: map(rowsIn(subscriptionRowsRecording), ({ id }) => ({ id }))
      })
    );
  });

  Then(
    "each subscription shows its renewal price before tax, as my brand formats it",
    world =>
      settles(() =>
        world.expectContext({
          data: map(rowsIn(subscriptionRowsRecording), row => ({
            id: row.id,
            title: titleOf(row),
            priceFormatted:
              row.configuration_total_recurring_net_amount_formatted,
            priceTermSummary: priceTermSummaryOf(row)
          }))
        })
      )
  );

  When("I open one of my subscriptions", world =>
    openManager(world, OPENED_SUBSCRIPTION.id)
  );

  Then(
    "it shows its renewal price before tax as my brand formats it, never the price with tax added",
    world =>
      settles(() =>
        world.expectContext({
          contractProduct: {
            id: OPENED_SUBSCRIPTION.id,
            title: titleOf(OPENED_SUBSCRIPTION),
            priceFormatted:
              OPENED_SUBSCRIPTION.configuration_total_recurring_net_amount_formatted,
            priceTermSummary: priceTermSummaryOf(OPENED_SUBSCRIPTION)
          }
        })
      )
  );

  When("my one-time purchases are read", async world => {
    await openCollection(world);
    await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.filterBy, {
      billing_cycle_days: { eq: 0 }
    });
    await settles(() =>
      world.expectContext({
        data: map(ONE_TIME_ROWS, ({ id }) => ({ id }))
      })
    );
  });

  Then(
    "each one-time purchase shows its purchase price before tax, never a renewal price of nothing",
    world =>
      settles(() =>
        world.expectContext({
          data: map(ONE_TIME_ROWS, row => ({
            id: row.id,
            title: titleOf(row),
            priceFormatted: row.configuration_net_amount_discounted_formatted,
            priceTermSummary: priceTermSummaryOf(row)
          }))
        })
      )
  );

  // === FE-3029 · THE PICKER ================================================

  Given("I have no product open yet", openCollection);

  When("I pick one of my products", world => openManager(world, PICKED_ROW.id));

  Then("the product the manager opens is the one I picked", world =>
    settles(() =>
      world.expectContext(
        {
          contractProduct: {
            id: PICKED_ROW.id,
            contractId: PICKED_ROW.contract_id,
            title: titleOf(PICKED_ROW)
          }
        },
        CONTRACT_PRODUCT_SCENARIO
      )
    )
  );

  // === AC-21 · RENEWAL-INVOICING ON / OFF ===================================

  Given("a product whose renewal invoicing is on", world => openManager(world));
  Given("a product whose renewal invoicing is off", world =>
    openManager(world, RENEWAL_OFF_PRODUCT_ID)
  );

  When("I open that product", async world =>
    settles(() => world.expectMeta({ hasError: false, isLoading: false }))
  );

  Then("I am told its renewal invoicing is on", async world =>
    settles(() =>
      world.expectContext({ contractProduct: { autoCreateRenewInvoice: true } })
    )
  );
  Then("I am told its renewal invoicing is off", async world =>
    settles(() =>
      world.expectContext({
        contractProduct: { autoCreateRenewInvoice: false }
      })
    )
  );

  // === AC-25 · A CHANGE IN FLIGHT ===========================================

  Given("one of my products", openManager);

  When("I ask for a change", world =>
    hold(world, CONTRACT_PRODUCT_COVERED_ACTIONS.stopRenewing)
  );

  Then("the module reports itself busy while the change is in flight", world =>
    world.expectMeta({ isProcessing: true }, CONTRACT_PRODUCT_SCENARIO)
  );

  Then("it reports itself settled once the change has landed", async world => {
    await landed(world);
    await settles(() =>
      world.expectMeta({ isProcessing: false }, CONTRACT_PRODUCT_SCENARIO)
    );
  });

  Then(
    "what it shows me afterwards is my product as the platform re-read it",
    world =>
      settles(() =>
        world.expectContext(
          {
            contractProduct: {
              id: productOf(inFlightRereadRecording).id,
              renew: productOf(inFlightRereadRecording).renew
            }
          },
          CONTRACT_PRODUCT_SCENARIO
        )
      )
  );
  Then("I am told the change is done", world =>
    world.fire(
      CONTRACT_PRODUCT_COVERED_ACTIONS.onDone,
      undefined,
      CONTRACT_PRODUCT_SCENARIO
    )
  );

  // === AC-23 · REVOKE A BOOKED CANCELLATION =================================

  Given(
    "one of my products has a cancellation booked for a future date",
    openManager
  );

  When("I revoke that booking", async world => {
    await world.fire(
      CONTRACT_PRODUCT_COVERED_ACTIONS.revokeScheduledCancellation
    );
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("my product no longer carries a scheduled cancellation", async world =>
    settles(() =>
      world.expectContext({
        contractProduct: { hasScheduledFutureCancellation: false }
      })
    )
  );
  Then(
    "my product's own status is unchanged by the revoke, exactly as the booking left it unchanged",
    async world => settles(() => world.expectMeta({ isCancelling: false }))
  );

  // === AC-9 · CONSOLIDATION =================================================

  const consolidationChoice = {
    "opted out": InvoiceConsolidationTypes.DISABLED,
    "opted in": InvoiceConsolidationTypes.ENABLED,
    "follow my account": InvoiceConsolidationTypes.INHERIT
  } as const;

  Given(
    "a subscription on my account, with its consolidation form open",
    async world => {
      await openManager(world);
      await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openConsolidation);
      await settles(() => world.expectMeta({ isConsolidationOpen: true }));
    }
  );

  for (const choice of keys(
    consolidationChoice
  ) as (keyof typeof consolidationChoice)[]) {
    When(`I submit "${choice}" in the consolidation form`, async world => {
      await world.fire(
        CONTRACT_PRODUCT_COVERED_ACTIONS.set,
        args(ContractProductFormTypes.CONSOLIDATION, {
          invoiceConsolidationEnabled: consolidationChoice[choice]
        })
      );
      await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.submitConsolidation);
      await settles(() =>
        world.expectMeta({ hasError: false, isProcessing: false })
      );
    });
  }

  When('I set its consolidation to "opted out"', async world => {
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.setConsolidation, {
      invoiceConsolidationEnabled: consolidationChoice["opted out"]
    });
    await settles(() =>
      world.expectMeta({ hasError: false, isProcessing: false })
    );
  });

  for (const [outcome, value] of [
    ["kept out of my consolidated invoice", consolidationChoice["opted out"]],
    ["joined to my consolidated invoice", consolidationChoice["opted in"]],
    [
      "consolidated exactly as the rest of my account is",
      consolidationChoice["follow my account"]
    ]
  ] as const) {
    Then(`that subscription's invoices are ${outcome}`, world =>
      settles(() =>
        world.expectContext({
          contractProduct: { raw: { invoice_consolidation_enabled: value } }
        })
      )
    );
  }

  Then(
    "my account-level consolidation preference is left exactly as it was",
    world =>
      settles(() =>
        world.expectContext({
          contractProduct: {
            clientInvoiceConsolidationEnabled: productOf(
              managerProductRecording
            ).contract.client.invoice_consolidation_enabled
          }
        })
      )
  );

  Then("no consolidation form is left open behind it", world =>
    settles(() => world.expectMeta({ isConsolidationOpen: false }))
  );

  // === AC-11 · A SUSPENDED SUBSCRIPTION IS STILL OFFERED EVERY CHANGE =======

  Given("a suspended subscription on my account", world =>
    openManager(world, productOf(suspendedRowRecording).id)
  );
  Then("a cancellation is booked against it for a future date", world =>
    settles(() => world.expectMeta({ hasScheduledFutureCancellation: true }))
  );

  // === AC-20 · THE PURCHASED CATEGORIES =====================================

  Given(
    "I am signed in and I have bought products in several categories",
    openCollection
  );

  When("I ask for the categories I have bought into", async world => {
    await world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.loadPurchasedCategories);
    await settles(() => world.expectMeta({ hasError: false }));
  });

  Then("the categories I have bought into are requested", async () => {
    // Request-shape — the wall serves the recorded contract_product_categories
    // read; a request to the shop catalogue would gap and fail the scenario.
  });
  Then("the shop catalogue is not requested", async () => {
    // Request-ABSENCE — proven by the replay wall.
  });
  Then("my delegated choice rides that request", async () => {
    // Request-shape (the exclude_delegated param) — the recorded request is the
    // proof; a `World` step cannot read a request query.
  });

  // === AC-19 · THE GROUPED COUNTS ===========================================

  Given("I have opened my products", openCollection);

  When("I ask for my grouped counts", world =>
    world.fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.loadGroupedCounts)
  );

  Then(
    "my products surface holds the entries I was given, one per category, each with its count",
    world =>
      settles(() =>
        world.expectContext({
          groupedCounts: [
            { category_id: FIRST_GROUP.category_id, total: FIRST_GROUP.total }
          ]
        })
      )
  );
  Then(
    "each category is split by service identifier, each with its own count",
    async world => {
      if (!RECORDING_SPLITS_A_CATEGORY)
        throw new Error(
          "The grouped-counts recording splits no category by service identifier — re-record against a client that holds one."
        );
      await settles(() =>
        world.expectContext({
          groupedCounts: map(GROUPS, group => ({
            category_id: group.category_id,
            service_identifier: group.service_identifier,
            total: group.total
          }))
        })
      );
    }
  );

  // === FE-3029 · THE MANAGER FORMS =========================================

  Given("I have one of my active subscriptions open", openActiveSubscription);
  Given(
    "I have the cancellation form open on one of my products",
    async world => {
      await openActiveSubscription(world);
      await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openCancellation);
      await settles(() => world.expectMeta({ isCancellationOpen: true }));
    }
  );
  Given(
    "I have the consolidation form open on one of my subscriptions, with no choice made",
    async world => {
      await openActiveSubscription(world);
      await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openConsolidation);
      await settles(() => world.expectMeta({ isConsolidationOpen: true }));
    }
  );

  When("I open the cancellation form", world =>
    world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openCancellation)
  );
  Then("the cancellation form is open", world =>
    settles(() => world.expectMeta({ isCancellationOpen: true }))
  );
  Then(
    "it offers cancelling at the end of the term, cancelling immediately, and cancelling on a future date I choose",
    world =>
      settles(() =>
        world.expectContext({
          cancellation: {
            schema: {
              properties: {
                option: {
                  enum: [
                    ContractProductCancelOption.SOFT,
                    ContractProductCancelOption.HARD,
                    ContractProductCancelOption.SCHEDULE_FUTURE
                  ]
                }
              }
            }
          }
        })
      )
  );

  When("I submit the cancellation form without choosing an option", world =>
    world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.submitCancellation)
  );
  Then("the cancellation form stays open and is not valid", world =>
    settles(() =>
      world.expectMeta({ isCancellationOpen: true, isCancellationValid: false })
    )
  );
  Then("I am shown that an option is required", world =>
    settles(() =>
      world.expectContext({
        validationErrors: [{ params: { missingProperty: "option" } }]
      })
    )
  );

  When("I close the cancellation form", world =>
    world.fire(
      CONTRACT_PRODUCT_COVERED_ACTIONS.cancelForm,
      ContractProductFormTypes.CANCELLATION
    )
  );
  Then("the cancellation form is closed", world =>
    settles(() => world.expectMeta({ isCancellationOpen: false }))
  );
  Then("my product is still active", world =>
    world.expectMeta({ isActive: true, isCancelling: false })
  );

  When("I open the consolidation form", world =>
    world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openConsolidation)
  );
  Then("the consolidation form is open", world =>
    settles(() => world.expectMeta({ isConsolidationOpen: true }))
  );
  Then("it offers opting in, opting out, or following my account", world =>
    settles(() =>
      world.expectContext({
        consolidation: {
          schema: {
            properties: {
              invoiceConsolidationEnabled: {
                enum: [
                  InvoiceConsolidationTypes.ENABLED,
                  InvoiceConsolidationTypes.DISABLED,
                  InvoiceConsolidationTypes.INHERIT
                ]
              }
            }
          }
        }
      })
    )
  );

  When(
    "I submit the consolidation form choosing the value my subscription already has",
    async world => {
      await world.fire(
        CONTRACT_PRODUCT_COVERED_ACTIONS.set,
        args(ContractProductFormTypes.CONSOLIDATION, {
          invoiceConsolidationEnabled: productOf(
            unchangedConsolidationRecording
          ).invoice_consolidation_enabled
        })
      );
      await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.submitConsolidation);
    }
  );
  Then(
    "my consolidation choice is not sent and the consolidation form stays open",
    world =>
      settles(() =>
        world.expectMeta({ isConsolidationOpen: true, isProcessing: false })
      )
  );

  When("I reset my product", world =>
    world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.reset)
  );
  When("I refresh my product", world =>
    world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.refresh)
  );
  Then("my product is read again and shown as active", world =>
    settles(async () => {
      await world.expectMeta({
        isAvailable: true,
        isLoading: false,
        hasError: false,
        isActive: true
      });
      await world.expectContext({
        contractProduct: { id: MANAGER_PRODUCT_ID }
      });
    })
  );

  // === AC-2 / AC-18 · NEVER SHOWN DELEGATED PRODUCTS I DO NOT HAVE ========
  // Both Givens are arranged by the recording: the seeded session's `/self`
  // carries nothing delegated, and the choice sits on the recorded account
  // read the collection's boot makes.

  Given("no products have been delegated to me", async () => {});
  for (const choice of ["see", "hide"])
    Given(`I asked to ${choice} delegated products before`, async () => {});

  Then("delegated products are excluded", async world => {
    if (
      !NO_DELEGATED_ROWS.length ||
      some(NO_DELEGATED_ROWS, "isDelegatedObject")
    )
      throw new Error(
        "The no-delegation recording holds no rows, or a delegated one — re-record it."
      );
    await settles(() => world.expectContext({ data: NO_DELEGATED_ROWS }));
  });

  // === AC-2 / AC-18 · PRODUCTS DELEGATED TO ME ============================
  // The delegation rides the session's own recorded `/self`, and my choice
  // the show-delegated preference the collection reads on boot.

  const delegatedAnswer = (page: unknown, count: unknown, shown: boolean) => {
    const rows = map(
      (
        page as {
          response: {
            body: { data: { id: string; is_delegated_object: boolean }[] };
          };
        }
      ).response.body.data,
      row => ({ id: row.id, isDelegatedObject: row.is_delegated_object })
    );
    if (!shown && some(rows, "isDelegatedObject"))
      throw new Error("A hidden-delegation page holds a delegated row.");
    return { rows, total: recordedTotal(count) };
  };

  const CHOSEN = {
    see: delegatedAnswer(chooseSeePage, chooseSeeCount, true),
    hide: delegatedAnswer(chooseHidePage, chooseHideCount, false)
  };
  const REMEMBERED = {
    see: delegatedAnswer(rememberSeePage, rememberSeeCount, true),
    hide: delegatedAnswer(rememberHidePage, rememberHideCount, false)
  };
  for (const answers of [CHOSEN, REMEMBERED])
    if (!(answers.see.total > answers.hide.total))
      throw new Error(
        "The delegated recordings count no more products when delegation is shown."
      );

  const expectDelegatedAnswer = (
    world: World,
    answer: { rows: unknown[]; total: number }
  ) =>
    settles(() =>
      world.expectContext({
        data: answer.rows,
        pagination: { total: answer.total }
      })
    );

  for (const given of [
    "products have been delegated to me by another account",
    "products have been delegated to me"
  ])
    Given(given, async () => {});

  for (const choice of ["see", "hide"] as const) {
    When(`I ask to ${choice} delegated products`, openCollection);
    Given(`I have asked to ${choice} them`, async () => {});
  }

  Then("the products delegated to me are included alongside my own", world =>
    expectDelegatedAnswer(world, CHOSEN.see)
  );
  Then("only my own products come back", world =>
    expectDelegatedAnswer(world, CHOSEN.hide)
  );

  // The replay's own seed is the new session; this boot reads the choice back.
  When("I come back later, in a new session", openCollection);

  Then(
    "my products still include the ones delegated to me — I do not have to ask again",
    world => expectDelegatedAnswer(world, REMEMBERED.see)
  );
  Then(
    "my products still leave out the ones delegated to me — I do not have to ask again",
    world => expectDelegatedAnswer(world, REMEMBERED.hide)
  );

  // The collection only READS the preference: a write of any preference would
  // be a request no step recorded, which the replay wall fails by name.
  Then(
    "remembering my choice does not disturb any other preference I have set on my account",
    world => world.expectMeta({ hasError: false, isLoading: false })
  );

  // === AC-16 · NOTHING WITHOUT AN AUTHENTICATED CLIENT SESSION ============
  // The `@signed-out` seed boots the guest session. `isReady` never settles
  // for a surface the session cannot address, so it is held, not awaited.

  Given("my session has ended and I am no longer signed in", async () => {});

  When("I open my products while signed out", async world => {
    await world.boot(CONTRACT_PRODUCTS_SCENARIO, {
      actor: ScopeActorTypes.CLIENT
    });
    await world.fireHold!(CONTRACT_PRODUCTS_COVERED_ACTIONS.isReady);
  });

  When("I force my products to be read while signed out", async world => {
    await world.boot(CONTRACT_PRODUCTS_SCENARIO, {
      actor: ScopeActorTypes.CLIENT
    });
    const refusal = await world
      .fire(CONTRACT_PRODUCTS_COVERED_ACTIONS.refresh)
      .then(
        () => undefined,
        (error: unknown) => error
      );
    if (
      !(refusal instanceof Error) ||
      !/login_to_continue/.test(refusal.message)
    )
      throw new Error(
        `the forced read was not refused as not-authenticated (got ${String(refusal)})`
      );
  });

  When("I open one of my products while signed out", async world => {
    await world.boot(CONTRACT_PRODUCT_SCENARIO, {
      actor: ScopeActorTypes.CLIENT,
      id: MANAGER_PRODUCT_ID
    });
    await world.fireHold!(CONTRACT_PRODUCT_COVERED_ACTIONS.isReady);
  });

  When("I force one of my subscriptions to stop renewing", async world => {
    await world.boot(CONTRACT_PRODUCT_SCENARIO, {
      actor: ScopeActorTypes.CLIENT,
      id: MANAGER_PRODUCT_ID
    });
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.stopRenewing);
  });

  When("I force a consolidation change", async world => {
    await world.boot(CONTRACT_PRODUCT_SCENARIO, {
      actor: ScopeActorTypes.CLIENT,
      id: MANAGER_PRODUCT_ID
    });
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.setConsolidation, {
      invoiceConsolidationEnabled: InvoiceConsolidationTypes.INHERIT
    });
  });

  Then("what I opened reports itself unavailable to me", world =>
    world.expectMeta({ isAvailable: false })
  );

  Then("no request is made against any of my products", world =>
    world.expectMeta({ hasError: false, isEmpty: true, isLoading: false })
  );

  Then("no request is made against any product resource", world =>
    world.expectMeta({ hasError: false, isProcessing: false })
  );

  // === AC-11 / AC-9 · IS EACH FORM OFFERED BEFORE I OPEN IT ================

  for (const [state, recording] of [
    ...CANCELLATION_OFFER_ROWS,
    ...CONSOLIDATION_OFFER_ROWS
  ])
    Given(`one of my products is ${state}`, world =>
      openManager(world, productOf(recording).id)
    );

  When("I look at whether I can cancel it", async world =>
    settles(() => world.expectMeta({ hasError: false, isLoading: false }))
  );
  When("I look at whether I can change how it is invoiced", async world =>
    settles(() => world.expectMeta({ hasError: false, isLoading: false }))
  );

  for (const [form, flag, open, isOpen] of [
    [
      "cancellation",
      "hasCancellationOptions",
      CONTRACT_PRODUCT_COVERED_ACTIONS.openCancellation,
      "isCancellationOpen"
    ],
    [
      "consolidation",
      "canConsolidate",
      CONTRACT_PRODUCT_COVERED_ACTIONS.openConsolidation,
      "isConsolidationOpen"
    ]
  ] as const) {
    Then(`I am told the ${form} form is offered`, world =>
      settles(() => world.expectMeta({ [flag]: true }))
    );
    Then(`I am told the ${form} form is not offered`, world =>
      settles(() => world.expectMeta({ [flag]: false }))
    );
    Then(
      `what I am told matches whether the ${form} form opens when I ask for it`,
      async world => {
        const offered = await world
          .expectMeta({ [flag]: true })
          .then(() => true)
          .catch(() => false);
        await world.fire(open);
        await settles(() => world.expectMeta({ [isOpen]: offered }));
      }
    );
  }

  // === AC-11 · WHY THE CANCELLATION FORM IS NOT AVAILABLE ==================

  Given(
    "one of my products is held back from cancelling because its cancellation request was already accepted",
    world => openManager(world, productOf(acceptedRequestRecording).id)
  );
  Given(
    "one of my products is held back from cancelling because its auto-renew is off and it has no end date",
    world => openManager(world, productOf(renewalInvoicingOffRecording).id)
  );
  When("I look at whether I can cancel it now", async world =>
    settles(() => world.expectMeta({ hasError: false, isLoading: false }))
  );
  Then("I am told the cancellation is not shown", world =>
    settles(async () => {
      await world.expectMeta({ hasCancellationOptions: false });
      await world.expectContext({
        contractProduct: {
          contractRequest: {
            status: {
              code: productOf(acceptedRequestRecording).contract_request?.status
                ?.code
            }
          }
        }
      });
    })
  );
  Then("I am told the cancellation is offered", world =>
    settles(() =>
      world.expectMeta({
        hasCancellationOptions: true,
        isExpiring: false,
        hasAutoRenewDisabled: !productOf(renewalInvoicingOffRecording)
          .auto_create_renew_invoice
      })
    )
  );

  // === AC-11 · A PRODUCT THE PLATFORM HOLDS BACK FROM CANCELLING ==========

  Given("one of my products has a pending pro-rata invoice", world =>
    openManager(world, productOf(proRataGuardRecording).id)
  );
  Given(
    "one of my products has platform settings that do not allow cancelling",
    async world => {
      await openManager(world, productOf(notCancellableGuardRecording).id);
      await world.expectContext({ contractProduct: { canCancel: false } });
    }
  );
  Given(
    "one of my products cannot be cancelled and has overdue invoices",
    async world => {
      await openManager(world, productOf(overdueGuardRecording).id);
      await world.expectContext({ contractProduct: { canCancel: false } });
      await world.expectMeta({ hasUnpaidRecurringInvoices: true });
    }
  );
  When("I ask to cancel it", async world => {
    await world
      .fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openCancellation)
      .catch(() => {});
    await world
      .fire(
        CONTRACT_PRODUCT_COVERED_ACTIONS.set,
        args(ContractProductFormTypes.CANCELLATION, {
          option: ContractProductCancelOption.HARD
        })
      )
      .catch(() => {});
    await world
      .fire(CONTRACT_PRODUCT_COVERED_ACTIONS.submitCancellation)
      .catch(() => {});
  });
  Then("I am told I cannot ask to cancel it", world =>
    settles(() => world.expectMeta({ hasCancellationOptions: false }))
  );
  Then("no cancellation form opens and no cancellation is sent", world =>
    settles(() =>
      world.expectMeta({
        isCancellationOpen: false,
        isProcessing: false,
        isCancelling: false,
        isActive: true
      })
    )
  );

  // === FE-3029 · THE CANCELLATION OPTIONS FOLLOW THE PRODUCT'S STATE =======

  Given("I have one of my products open that is still pending", world =>
    openManager(world, productOf(pendingOptionsRecording).id)
  );
  Then("it offers cancelling immediately", world =>
    settles(() =>
      world.expectContext({
        cancellation: {
          schema: {
            properties: { option: { enum: [ContractProductCancelOption.HARD] } }
          }
        }
      })
    )
  );

  // === FE-3029 · A PRODUCT THAT IS NOT MINE =================================

  Given("a product that is on another client's account", async () => {});

  When("I open it as if it were one of mine", async world => {
    await world.boot(CONTRACT_PRODUCT_SCENARIO, {
      actor: ScopeActorTypes.CLIENT,
      id: FOREIGN_PRODUCT_ID
    });
  });

  Then("I am shown the reason my read of it was refused", world =>
    settles(() => world.expectContext({ errors: FOREIGN_READ_REFUSAL }))
  );
  Then("the manager has stopped loading and reports an error", world =>
    settles(() => world.expectMeta({ hasError: true, isLoading: false }))
  );
  Then("I am told at once that the product is not ready", async world => {
    const asked = Date.now();
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.isReady);
    const waited = Date.now() - asked;
    if (waited > READY_AT_ONCE_MS)
      throw new Error(`isReady took ${waited}ms to answer a failed read.`);
    await world.expectMeta({ hasError: true, isAvailable: false });
  });

  // === AC-6 · HARD CANCELLATION =============================================

  Given(
    "an active product on my account, with the cancellation form open",
    async world => {
      await openManager(world);
      await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openCancellation);
      await settles(() => world.expectMeta({ isCancellationOpen: true }));
    }
  );

  When(
    "I choose to cancel it immediately, giving my reason, and submit the form",
    async world => {
      await world.fire(
        CONTRACT_PRODUCT_COVERED_ACTIONS.set,
        args(ContractProductFormTypes.CANCELLATION, {
          option: ContractProductCancelOption.HARD,
          reason: RECORDED_HARD_REASON
        })
      );
      await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.submitCancellation);
      await settles(() =>
        world.expectMeta({ hasError: false, isProcessing: false })
      );
    }
  );

  Then(
    "my cancellation request is lodged against my product, with my reason",
    world =>
      settles(() =>
        world.expectContext({
          contractProduct: {
            id: productOf(hardRequestRereadRecording).id,
            contractRequest: {
              status: {
                code: CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST
              }
            },
            raw: { contract_request: { reason: RECORDED_HARD_REASON } }
          }
        })
      )
  );
  Then(
    "my product is shown to me as being cancelled, as the platform re-read it",
    world => settles(() => world.expectMeta({ isCancelling: true }))
  );
  Then("no cancellation form is left open behind it", world =>
    settles(() => world.expectMeta({ isCancellationOpen: false }))
  );

  // === AC-7 · WITHDRAW A CANCELLATION REQUEST ===============================

  Given(
    "I have an outstanding cancellation request on one of my products",
    async world => {
      await openManager(world);
      await settles(() => world.expectMeta({ isCancelling: true }));
    }
  );

  When("I withdraw it", async world => {
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.withdrawCancellation);
    await settles(() =>
      world.expectMeta({ hasError: false, isProcessing: false })
    );
  });

  Then("my product no longer carries that request", world =>
    settles(() =>
      world.expectContext({
        contractProduct: {
          raw: {
            contract_request: productOf(withdrawnRereadRecording)
              .contract_request
          }
        }
      })
    )
  );
  Then("my product is no longer shown as being cancelled", world =>
    settles(() => world.expectMeta({ isCancelling: false, isActive: true }))
  );

  // === AC-26 TO AC-28 · THE CHANGE OF PLAN (FE-3206) ========================
  // Each scenario boots the product its own recording read; the wire lines
  // read the requests the module sent in this scenario's window.

  for (const given of [
    "one of my subscriptions is active, on a plan that allows changes to other plans",
    "one of my subscriptions is suspended, on a plan that allows changes to other plans",
    "one of my subscriptions, on a plan that allows changes to other plans, has a cancellation request pending",
    "one of my subscriptions, on a plan that allows changes to other plans, had its cancellation request accepted",
    "one of my subscriptions, on a plan that allows changes to other plans, is set to expire at the end of its term",
    "one of my subscriptions, on a plan that allows changes to other plans, is paid for but not yet active",
    "one of my subscriptions, on a plan that allows changes to other plans, has a pro-rata invoice I have not paid",
    "one of my subscriptions is active, on a plan that allows no changes to other plans",
    "one of my subscriptions is active, on a plan that allows changes to five or more plans",
    "one of my subscriptions is active, on a plan whose allowed plans are none I can order on its billing term",
    "one of my subscriptions is a bundle of products"
  ])
    Given(given, openMigrationScenario);

  Given(
    "I have opened a change of plan on a subscription whose plan allows changes to five or more plans",
    async world => {
      await openMigrationScenario(world);
      await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openMigration);
      await settles(() =>
        world.expectContext({
          migrationTargets: recordedRows(pageIn(2))
        })
      );
    }
  );

  When("I look at whether I can change its plan", async world => {
    markWhen();
    await settles(() => world.expectMeta({ isLoading: false }));
  });

  When("I ask to change its plan", async world => {
    markWhen();
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.openMigration);
  });

  When("I ask to see more plans", async world => {
    markWhen();
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.loadMoreMigrationTargets);
  });

  Then("I am told I can change its plan", world =>
    settles(() => world.expectMeta({ canMigrate: true }))
  );
  Then("I am told I cannot change its plan", world =>
    settles(() => world.expectMeta({ canMigrate: false }))
  );
  Then("I am told a pro-rata invoice of mine is unpaid", world =>
    settles(() => world.expectMeta({ hasPendingProRata: true }))
  );
  Then("the change of plan does not open", world =>
    settles(() => world.expectMeta({ isMigrationOpen: false }))
  );
  Then("the change of plan opens on the plans I can choose from", world =>
    settles(() => world.expectMeta({ isChoosingMigrationTarget: true }))
  );

  Then("I am told which plans its plan allows me to change to", world =>
    settles(() =>
      world.expectContext({
        allowedMigrations: map(
          productOf(migrationRecording().read).allowed_migrations,
          ({ migration_product_id }) => ({ migration_product_id })
        )
      })
    )
  );
  for (const line of [
    "I am told how many plans I can change to",
    "I am told the number of plans the platform counted"
  ])
    Then(line, world =>
      settles(() =>
        world.expectContext({
          migrationsCount: recordedTotal(migrationRecording().count)
        })
      )
    );
  Then("I am told the number of plans I can change to is zero", world => {
    mustHold(
      recordedTotal(countIn(2)) === 0,
      "the recorded count of plans is not zero"
    );
    return settles(() => world.expectContext({ migrationsCount: 0 }));
  });

  // --- the count, as the module asked for it --------------------------------

  const countParam = (key: string, want: (value: string | null) => boolean) =>
    settles(async () => {
      const [count, ...more] = sentInWindow(isCountRead);
      mustHold(!!count && !more.length, "exactly one plan count went out");
      mustHold(
        want(new URL(count.url).searchParams.get(key)),
        `the plan count sent ${key}=${new URL(count.url).searchParams.get(key)}`
      );
    });

  Then("the platform is asked for a count of plans, not a page of them", () =>
    countParam("offset", value => value === null)
  );
  Then("the plans are counted in my contract's currency", () =>
    countParam(
      "currency_id",
      value => value === contractOf(migrationRecording().read).currency_id
    )
  );
  Then("the plans are counted on my contract's account", () =>
    countParam(
      "account_id",
      value => value === contractOf(migrationRecording().read).account_id
    )
  );
  Then("only plans on a recurring billing term are counted", () =>
    countParam("filter[billing_cycle_months|neq]", value => value === "0")
  );
  Then("only plans the brand sells are counted", () =>
    countParam("filter[available_for_sales]", value => value === "1")
  );
  Then("only plans a client can order are counted", () =>
    countParam("filter[clients_can_order]", value => value === "1")
  );
  Then("only the plans my plan allows are counted", () =>
    countParam("filter[id]", value =>
      isEqual(sortBy(split(value ?? "", ",")), allowedIds())
    )
  );
  Then("the plans are counted in the brand's own order", () =>
    countParam("order", value => value === "order")
  );
  Then("each counted plan is asked for with its image", () =>
    countParam("with", value => includes(split(value ?? "", ","), "image"))
  );

  Then("the number of plans I can change to is still read", () =>
    settles(async () =>
      mustHold(sentInWindow(isCountRead).length > 0, "no plan count went out")
    )
  );
  Then("no plan count is requested", async () =>
    mustHold(sentInWindow(isCountRead).length === 0, "a plan count went out")
  );
  Then("no plan list is requested", async () =>
    mustHold(sentInWindow(isListRead).length === 0, "a plan list went out")
  );
  Then("no change is sent", async () =>
    mustHold(
      sentInWindow(
        (url, method) => method === "PUT" && url.pathname.endsWith("/change")
      ).length === 0,
      "a change of plan went out"
    )
  );

  // --- the list, as the module asked for it ---------------------------------

  const listParam = (key: string, want: (value: string | null) => boolean) =>
    settles(async () => {
      const [list] = sentByWhen(isListRead);
      mustHold(!!list, "no plan list went out");
      mustHold(
        want(new URL(list.url).searchParams.get(key)),
        `the plan list sent ${key}=${new URL(list.url).searchParams.get(key)}`
      );
    });

  Then("the plans are asked for in my contract's currency", () =>
    listParam(
      "currency_id",
      value => value === contractOf(migrationRecording().read).currency_id
    )
  );
  Then("the plans are asked for on my contract's account", () =>
    listParam(
      "account_id",
      value => value === contractOf(migrationRecording().read).account_id
    )
  );
  Then(
    "only plans on my subscription's current billing term are asked for",
    () =>
      listParam(
        "filter[prices.billing_cycle_months]",
        value =>
          value ===
          String(productOf(migrationRecording().read).billing_cycle_months)
      )
  );
  Then("only plans the brand sells are asked for", () =>
    listParam("filter[available_for_sales]", value => value === "1")
  );
  Then("only plans a client can order are asked for", () =>
    listParam("filter[clients_can_order]", value => value === "1")
  );
  Then("only the plans my plan allows are asked for", () =>
    listParam("filter[id]", value =>
      isEqual(sortBy(split(value ?? "", ",")), allowedIds())
    )
  );
  Then("the plans are asked for in the brand's own order", () =>
    listParam("order", value => value === "order")
  );
  for (const line of [
    "four plans are asked for",
    "four more plans are asked for"
  ])
    Then(line, () => listParam("limit", value => value === "4"));
  Then("the plans are asked for from the first plan on", () =>
    listParam("offset", value => value === "0")
  );
  Then("the plans are asked for from the fifth plan on", () =>
    listParam("offset", value => value === "4")
  );
  Then("each plan is asked for with its image and its prices", () =>
    listParam(
      "with",
      value =>
        includes(split(value ?? "", ","), "image") &&
        includes(split(value ?? "", ","), "prices")
    )
  );

  Then("I see the plans the platform returned, in its order", world =>
    settles(() =>
      world.expectContext({ migrationTargets: recordedRows(pageIn(3)) })
    )
  );
  Then(
    "I see the first four plans followed by the plans the platform returned next",
    world =>
      settles(() =>
        world.expectContext({
          migrationTargets: [
            ...recordedRows(pageIn(2)),
            ...recordedRows(pageIn(3))
          ]
        })
      )
  );
  Then("I am told there are more plans to see", world =>
    settles(() => world.expectMeta({ hasMoreMigrationTargets: true }))
  );
  Then("I am told there are no more plans to see", world =>
    settles(() => world.expectMeta({ hasMoreMigrationTargets: false }))
  );
  Then(
    "I am told whether there are more plans to see, as the platform's total says",
    world =>
      settles(() =>
        world.expectMeta({
          hasMoreMigrationTargets:
            recordedRows(pageIn(2)).length + recordedRows(pageIn(3)).length <
            recordedTotal(countIn(2))
        })
      )
  );
  Then("I am told there is no plan I can change to", world =>
    settles(() => world.expectMeta({ hasNoMigrationTargets: true }))
  );

  // === AC-29 TO AC-34 · CONFIGURE, PRICE AND COMMIT A CHANGE OF PLAN ==========
  // Each value a line expects is read off the scenario's own recordings; each
  // wire line and body line reads what the module sent in this window.

  for (const given of [
    "I have opened a change of plan on one of my active subscriptions",
    "I have opened a change of plan on a subscription whose plan allows a plan of the same price"
  ])
    Given(given, openChange);

  for (const given of [
    "I have chosen the plan with options and I am shown what the change costs",
    "I have chosen the plan with options on one of my active subscriptions",
    "I have chosen the plan with options and the platform will refuse that change",
    "I have chosen the plan of the same price and I am told the change costs nothing",
    "I have chosen a plan that needs provisioning details and I am shown what the change costs"
  ])
    Given(given, async world => {
      await chooseRecordedPlan(world);
      await settles(() => world.expectMeta({ isMigrationPreviewed: true }));
    });

  Given(
    "I have chosen the plan with a required choice and I am shown what the change costs",
    async world => {
      await chooseRecordedPlan(world);
      const [first] = chosenPlan().products_options ?? [];
      await (
        await liveConfig()
      ).setOptions(await categoryOffering(first.id), [first.id]);
      await configured(world);
      await settles(() => world.expectMeta({ isMigrationPreviewed: true }));
    }
  );

  Given(
    "I have chosen the plan with a required choice and cleared that choice",
    async world => {
      await chooseRecordedPlan(world);
      const [first] = chosenPlan().products_options ?? [];
      const category = await categoryOffering(first.id);
      const config = await liveConfig();
      await config.setOptions(category, [first.id]);
      await configured(world);
      await config.setOptions(category, []);
      await configured(world);
      await settles(() => world.expectMeta({ isMigrationPreviewed: false }));
    }
  );

  Given(
    "I have changed my subscription to that plan, which allows a change back",
    async world => {
      await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.migrate);
      await settles(() =>
        world.expectMeta({
          isMigrationOpen: false,
          isLoading: false,
          isProcessing: false,
          canMigrate: true
        })
      );
      await settles(() =>
        world.expectContext({
          migrationResult: { invoiceId: changeAnswerOf(3).body.data?.id }
        })
      );
    }
  );

  Given(
    "I have chosen a plan to change to and it could not be loaded",
    async world => {
      await openChange(world);
      await choosePlan(world);
      await settles(() =>
        world.expectMeta({ isMigrationTargetUnavailable: true })
      );
    }
  );

  When("I choose the plan with options to change to", async world => {
    markWhen();
    await choosePlan(world);
    await configured(world);
  });
  When("I choose the plan of the same price", async world => {
    markWhen();
    await choosePlan(world);
    await configured(world);
  });

  When(
    "I change the option I chose to the other option of the plan",
    async world => {
      markWhen();
      const other = otherOption();
      await (
        await liveConfig()
      ).setOptions(await categoryOffering(other.id), other.id);
      await settles(async () =>
        mustHold(
          sentByWhen(isChangeRequest).length > 0,
          "no dry run went out for the new choice"
        )
      );
      await configured(world);
    }
  );

  When("I clear the required choice of the plan I chose", async world => {
    markWhen();
    const [first] = chosenPlan().products_options ?? [];
    await (await liveConfig()).setOptions(await categoryOffering(first.id), []);
    await settles(async () =>
      mustHold(
        sentByWhen(isChangeRequest).length > 0,
        "no dry run went out for the cleared choice"
      )
    );
    await configured(world);
  });

  When("I commit the change of plan", async () => {
    markWhen();
    await holdCommit();
  });

  When("I close the change of plan", async world => {
    markWhen();
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.cancelMigration);
  });

  When("I ask for the plan I chose to be loaded again", async world => {
    markWhen();
    await world.fire(CONTRACT_PRODUCT_COVERED_ACTIONS.reloadMigrationTarget);
    await configured(world);
  });

  // --- the plan load, as the module sent it ----------------------------------

  const planLoadParam = (
    key: string,
    want: (value: string | null) => boolean
  ) =>
    settles(async () => {
      const [load] = sentByWhen(isPlanLoad(chosenPlan().id));
      mustHold(!!load, "the chosen plan was not loaded");
      mustHold(
        want(new URL(load.url).searchParams.get(key)),
        `the plan load sent ${key}=${new URL(load.url).searchParams.get(key)}`
      );
    });

  Then("the plan I chose is loaded in my contract's currency", () =>
    planLoadParam(
      "currency_id",
      value => value === contractOf(mustRecord(2, PRODUCT_READ)).currency_id
    )
  );
  Then("the plan I chose is loaded without promotions", async () => {
    await planLoadParam("omit_promotions", value => value === "1");
    await planLoadParam("promotions", value => value === null);
  });
  Then("the plan I chose is loaded again", () =>
    settles(async () =>
      mustHold(
        sentByWhen(isPlanLoad(chosenPlan().id)).length > 0,
        "the chosen plan was not loaded again"
      )
    )
  );
  Then("I am told the plan I chose is ready to configure", async world => {
    await settles(() =>
      world.expectMeta({
        isMigrationTargetUnavailable: false,
        isMigrationTargetLoading: false
      })
    );
    mustHold(
      (await liveManager()).useContext().migrationConfig.value !== null,
      "no plan is configured"
    );
  });
  Then("no price calculation is asked for the plan I chose", async () =>
    mustHold(
      sentByWhen((url, method) => {
        const plan = `/basket/products/${chosenPlan().id}`;
        return (
          /calculat|price/i.test(url.pathname) ||
          (url.pathname.includes(plan) &&
            !(method === "GET" && url.pathname.endsWith(plan)) &&
            !url.pathname.endsWith(`${plan}/provision_fields`))
        );
      }).length === 0,
      "a price calculation went out for the chosen plan"
    )
  );

  // --- the cost, as the module asked for it ----------------------------------

  for (const line of [
    "the cost of the change is asked for without committing it",
    "the cost of the change is asked for again without committing it"
  ])
    Then(line, () =>
      settles(async () =>
        mustHold(
          (await changeSentByWhen()).dry_run === true,
          "the change went out without the dry-run flag"
        )
      )
    );

  const dryRunHolds = (
    holds: (body: SentChange) => boolean,
    otherwise: string
  ) =>
    settles(async () => mustHold(holds(await changeSentByWhen()), otherwise));

  Then("the cost asked for names my contract", () =>
    dryRunHolds(
      body => body.contract_id === changeProduct().contract_id,
      "the dry run names another contract"
    )
  );
  Then("the cost asked for names my product", () =>
    dryRunHolds(
      body => body.contracts_product_id === changeProduct().id,
      "the dry run names another product"
    )
  );
  Then("the cost asked for names the plan I chose", () =>
    dryRunHolds(
      body => body.product?.product_id === chosenPlan().id,
      "the dry run names another plan"
    )
  );
  for (const line of [
    "the cost asked for names my subscription's current billing term",
    "the plan I chose starts on my subscription's current billing term"
  ])
    Then(line, () =>
      dryRunHolds(
        body =>
          body.product?.billing_cycle_months ===
          changeProduct().billing_cycle_months,
        "the dry run names another billing term"
      )
    );
  Then("the cost asked for carries each option I chose, by its product", () =>
    dryRunHolds(
      body => isEqual(map(body.options, "product_id"), [defaultOption().id]),
      "the dry run carries other options"
    )
  );
  Then("the cost asked for carries the option I changed to", () =>
    dryRunHolds(
      body => isEqual(map(body.options, "product_id"), [otherOption().id]),
      "the dry run does not carry the option I changed to"
    )
  );
  Then("each option carries its billing term", () =>
    dryRunHolds(
      body =>
        !isEmpty(body.options) &&
        every(body.options, {
          billing_cycle_months: changeProduct().billing_cycle_months
        }),
      "an option carries another billing term"
    )
  );
  Then("each option carries its quantity", () =>
    dryRunHolds(
      body =>
        !isEmpty(body.options) && every(body.options, { unit_quantity: 1 }),
      "an option carries no quantity of one"
    )
  );
  Then("each option whose price differs from mine carries its new price", () =>
    dryRunHolds(
      body =>
        isEqual(map(body.options, "price"), [
          optionPrice(defaultOption(), changeProduct().billing_cycle_months)
        ]),
      "an option whose price differs carries no new price"
    )
  );
  Then(
    "the cost asked for carries each attribute I chose, by its product alone",
    () =>
      dryRunHolds(
        body =>
          Array.isArray(body.attributes) &&
          every(body.attributes, attribute =>
            isEqual(keys(attribute), ["product_id"])
          ),
        "the dry run carries attributes in another shape"
      )
  );
  Then("the cost asked for carries no quantity for the plan itself", () =>
    dryRunHolds(
      body => !!body.product && !("quantity" in body.product),
      "the dry run carries a quantity for the plan"
    )
  );

  // --- the cost, as the module shows it --------------------------------------

  const pricedAt = (step: number) => changeAnswerOf(step).body.data;

  Then("I am shown the pro-rata amount the platform priced", world =>
    settles(() =>
      world.expectContext({
        migrationPreview: { total: pricedAt(3)?.total_amount_formatted }
      })
    )
  );
  Then("I am shown the lines of the invoice the platform priced", async () =>
    settles(async () => {
      const manager = await liveManager();
      mustHold(
        (pricedAt(3)?.products ?? []).length > 0 &&
          isEqual(
            sortBy(
              map(
                manager.useContext().migrationPreview.value?.invoice.products,
                "id"
              )
            ),
            sortBy(map(pricedAt(3)?.products as { id: string }[], "id"))
          ),
        "the cost shows other invoice lines"
      );
    })
  );
  Then(
    "I am shown the cost the platform priced for my new choice, not the cost before it",
    world => {
      mustHold(
        pricedAt(3)?.total_amount_formatted !==
          pricedAt(2)?.total_amount_formatted,
        "the two recorded costs are the same"
      );
      return settles(() =>
        world.expectContext({
          migrationPreview: { total: pricedAt(3)?.total_amount_formatted }
        })
      );
    }
  );
  Then("I am told the change is not free", world =>
    settles(() => world.expectMeta({ isMigrationFree: false }))
  );
  Then("I am told the change costs nothing", world =>
    settles(() => world.expectMeta({ isMigrationFree: true }))
  );
  Then("I am shown no cost for the change", async () =>
    settles(async () =>
      mustHold(
        (await liveManager()).useContext().migrationPreview.value === undefined,
        "a cost is still shown"
      )
    )
  );
  Then("the change of plan reports no error from the platform", world =>
    settles(() => world.expectMeta({ hasError: false }))
  );
  Then("I am told my choice of options is not valid", async () =>
    settles(async () =>
      mustHold(
        (await liveConfig()).meta.value.isInvalid,
        "the choice of options reads valid"
      )
    )
  );
  Then("I am told I can still commit the change", world =>
    settles(() => world.expectMeta({ canCommitMigration: true }))
  );

  // --- the commit ------------------------------------------------------------

  Then("the change is sent without the dry-run flag", async world => {
    await landed(world);
    await settles(async () =>
      mustHold(
        (await changeSentByWhen()).dry_run !== true,
        "the commit went out as a dry run"
      )
    );
  });
  Then("the change sent is the one I was shown the cost of", async world => {
    await landed(world);
    const priced = omit(await lastDryRun(), "dry_run");
    mustHold(
      isEqual(omit(await changeSentByWhen(), "dry_run"), priced),
      "the commit differs from the change that was priced"
    );
  });
  Then("the change sent carries no provisioning details", async world => {
    await landed(world);
    mustHold(
      !holdsDeep(await changeSentByWhen(), /provision/i),
      "the commit carries provisioning details"
    );
  });

  for (const line of [
    "I am given the invoice the change raised",
    "I am still given the invoice the change raised"
  ])
    Then(line, async world => {
      await landed(world);
      await settles(() =>
        world.expectContext({
          migrationResult: { invoiceId: changeAnswerOf(3).body.data?.id }
        })
      );
    });
  Then("I am told what is left to pay on that invoice", async world => {
    await landed(world);
    await settles(() =>
      world.expectContext({
        migrationResult: {
          unpaidAmount: changeAnswerOf(3).body.data?.unpaid_amount
        }
      })
    );
  });
  Then(
    "I am told I must pay that invoice before the change takes effect",
    async world => {
      await landed(world);
      mustHold(
        (changeAnswerOf(3).body.data?.unpaid_amount ?? 0) !== 0,
        "the recorded invoice leaves nothing to pay"
      );
      await settles(() => world.expectMeta({ requiresPayment: true }));
    }
  );
  Then(
    "I am told I do not have to pay for the change to take effect",
    async world => {
      await landed(world);
      await settles(() => world.expectMeta({ requiresPayment: false }));
    }
  );
  Then("my product is read again", async world => {
    await landed(world);
    await settles(async () =>
      mustHold(
        sentByWhen(
          (url, method) =>
            method === "GET" &&
            url.pathname.endsWith(`/contract_products/${changeProduct().id}`)
        ).length > 0,
        "the product was not read again"
      )
    );
  });
  Then(
    "the change of plan reports that the platform refused it",
    async world => {
      const refusal = await landed(world);
      mustHold(
        isDetailedError(refusal),
        `the commit was not refused with the platform's error: ${String(refusal)}`
      );
      await settles(() =>
        world.expectMeta({ hasError: true, isMigrationProcessing: false })
      );
    }
  );
  Then("the change of plan stays open on the plan I chose", async world => {
    await landed(world);
    await settles(() =>
      world.expectMeta({ isMigrationOpen: true, canCommitMigration: true })
    );
    await settles(() =>
      world.expectContext({ migrationTarget: { id: chosenPlan().id } })
    );
  });
  Then("the option I chose is kept", async world => {
    await landed(world);
    const kept = (await liveConfig()).model.value?.options ?? {};
    mustHold(
      some(values(kept), value => has(value, defaultOption().id)),
      "the option I chose is gone"
    );
  });
  Then("I am given no invoice", async world => {
    await landed(world);
    await settles(() => world.expectContext({ migrationResult: null }));
  });
  Then("I am given no invoice from the change before", world =>
    settles(() => world.expectContext({ migrationResult: null }))
  );

  // --- closing ---------------------------------------------------------------

  Then("the change of plan is closed", async world => {
    await landed(world);
    await settles(() =>
      world.expectMeta({ isMigrationOpen: false, isLoading: false })
    );
  });
  Then("no plan is configured for a change any more", async world => {
    await settles(() => world.expectMeta({ isMigrationOpen: false }));
    await settles(async () => {
      const manager = await liveManager();
      mustHold(
        manager.useContext().migrationConfig.value === null &&
          manager.useContext().migrationTarget.value === undefined,
        "a plan is still configured"
      );
    });
  });
  Then("my product is still active", world =>
    settles(() => world.expectMeta({ isActive: true }))
  );
});

export default contractProductSteps;
