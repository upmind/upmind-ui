# Affiliate Changelog

All notable changes to the affiliate module.

## [Unreleased]

### Added

- Client self-service affiliate data layer: own-account resolution, account read, enrolment, balance and statistics, programme gate and area settings.
- Referral links: criteria-driven list (search, sort, page), create, edit and delete through a link editor.
- Referrals, pending commissions and payouts lists, each with sort and page criteria. Payout rows are mapped to a camelCase row.
- Withdrawal request that returns the support ticket id.
- Payout destination editor: brand destinations, client emails, PayPal email preselection, save and re-seed from the saved account.
- Guest referral-link visit: records the visit, writes or deletes the raw `upm_aff` cookie and returns the redirect target.
- Pure helpers: `referralOrigin`, `commissionTagStatus`, `commissionSummaryStatus`, `isPaypalDestination`, `defaultPayoutDestination`.
- Translation keys `error.affiliate_*`, `text.affiliate_withdraw_balance` and `form.affiliate_*`.
- Shared types in `packages/types`: the payout record (`IAffiliatePayout`) and `referral_count` on the affiliate link (`IAffiliateLink`) and `affiliate_link` on the referral (`IAffiliateReferral`).

### Changed

- None. The module is new.

### Fixed

- None. The module is new.

### Not proven

These behaviours are wired and have no recording that proves them. See [Gotchas](./gotchas.md#known-unproven-behaviour).

- Disabled and staged account conditions.
- Brand default redirect pre-fill on a new link.
- A never-saved payout destination offering the brand default.
- Fall-back to the only account when `/self` has no account id.
- A PayPal destination with no email on open.
- The emails list replaced after adding an email.

### Out of scope

- Account switching: no chooser, no stored choice, no account select call.
- Staff cells and acting on behalf of a client.

---

## Migration Guide

### From the portal mock to this module

> The portal's affiliate mock exports contract types with the same names as this module's composables. The composables replace the mock's data; consumers keep the mock's `Use*` types for the client-affiliate, links, referrals, commissions and payouts composables. Four model types carry different names from the mock's (`AffiliateWithdrawalFormModel`, `AffiliateLinkFormModel`, `AffiliatePayoutDestinationFormModel`, `AffiliatePayoutRow`) and the scope matrix is `AffiliateScopeMatrix`.
