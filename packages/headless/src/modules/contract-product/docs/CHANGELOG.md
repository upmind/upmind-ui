# contract-product Changelog

All notable changes to the contract-product module.

## [Unreleased]

### Added

- **Change of plan (client, self).** A client can move a recurring single product to one of the plans its current plan allows. `openMigration()` opens the plan list; `selectMigrationTarget(id)` chooses a plan and loads its configurator; `reloadMigrationTarget()` retries a plan that failed to load; `loadMoreMigrationTargets()` pages the list; `cancelMigration()` closes it; `migrate()` commits and resolves to the invoice the change raised.
- **New context members** `migrationsCount`, `migrationTargets`, `migrationTarget`, `migrationConfig`, `migrationPreview` and `migrationResult`, and the meta flags `canMigrate`, `canCommitMigration`, `hasPendingProRata`, `isMigrationOpen`, `isChoosingMigrationTarget`, `isMigrationTargetsLoading`, `isMigrationTargetsLoadingMore`, `hasMigrationTargetsError`, `hasNoMigrationTargets`, `hasMoreMigrationTargets`, `isMigrationTargetLoading`, `isMigrationTargetUnavailable`, `isMigrationPreviewing`, `isMigrationPreviewed`, `isMigrationFree`, `isMigrationProcessing` and `requiresPayment`.
- **New exported types** `MigrationConfig`, `MigrationPreview`, `MigrationResult` and `MigrationTarget`.
- **`isProcessing` also covers an in-flight commit** of a change of plan.

### Changed

- **New view-model field `contractBillingCycleLabel`.** The owning contract's translated billing-cycle label (the product record's "Contract billing cycle"). `undefined` when the read carries no contract relation.

- **The settled read places the status node directly.** The load's completion is one ordered list of guarded transitions over the record it returned. A record with no known status now lands on `error` at once, so `isReady()` resolves `false` without a wait.
- **`exclude_delegated` follows whether anything is delegated.** It is `1` whenever nothing is delegated to the client; otherwise it is the held choice, `0` by default.
- **A brand can hide one-off purchases.** When the portal setting `@context.oneTimePurchases` is `"hidden"`, the list always excludes one-off purchases and the filter bar does not offer them.
- **New view-model fields `title` and `priceTermSummary`.** `title` is the shared product title; the picker's options use it too. `priceTermSummary` is the one price string ("£4 monthly", "£60").
- **Unpaid recurring invoices read their status from `invoice_status`.**
- **An unchanged consolidation choice is not sent.** `submitConsolidation()` resolves `false` and the form stays open.
- **Paging forward keeps the split total**, and the count read waits on the list's own addressability check.

- **Every cancellation write moved onto this module** — hard cancellation request (`requestCancellation`) and withdrawal (`withdrawCancellation`), alongside the soft (`stopRenewing`/`resumeRenewing`) and scheduled (`scheduleCancellation`/`revokeScheduledCancellation`) writes this module already owned. The sibling `contract` module keeps exactly one write of its own — changing the contract's payment method — because a contract only groups product ids; changing what happens to one product is this module's job.
- **The cancellation form is now ONE combined form over three options** (soft / hard / scheduled), not three independent calls with no shared shape. `openCancellation()` builds the form's schema from the options the record currently allows; `submitCancellation()` routes to the matching write off `model.option`. The six existing direct-call actions (`stopRenewing`, `resumeRenewing`, `requestCancellation`, `withdrawCancellation`, `scheduleCancellation`, `revokeScheduledCancellation`) open + set + submit the form in one call each, so no existing caller has to change.
- **The consolidation write is now a form too** (`openConsolidation`/`set`/`submitConsolidation`, or the direct `setConsolidation` call), matching the cancellation form's shape.
- **Both write forms are now parallel regions of `available`** (`cancelling`, `consolidating`), each with its own `idle` → `available` (checking/valid/invalid/error) → `processing` cycle. Opening either form never moves the product off its current status node, and a failed submit returns to that form's own error state with the model kept, rather than to a machine-wide error.
- **Cancel-form and consolidation eligibility now follow the legacy record rules exactly**: the whole cancellation form disappears (not just the HARD option) once auto-expire is already set, a hard request is pending, or a future cancellation is booked; the consolidation form opens only for a live, non-staged subscription whose client preference and catalogue product both allow it. Neither reads a brand setting or an actor permission — see gotchas.md for the known permission-check gap.
- **`useContractProduct().useMeta()` gained `canRequestCancellation` and `canRequestEndOfTerm`**, alongside the existing `canScheduleFutureCancellation`, reporting each cancellation option's own eligibility independent of the combined form.
- **The manager's read now settles the CANCEL_REQUEST custom-field catalogue alongside the product record**, in one load, so the cancellation form has its field definitions the moment it opens.

### Added

- Initial module: `useContractProducts` (client's own contract-products collection, filter/sort/pagination, grouped counts, purchased-category read, delegated-product inclusion) and `useContractProduct` (per-product manager backed by `contract-product.machine.ts` — stop/resume renewal, invoice-consolidation preference, scheduled/future-dated cancellation booking and revocation, unpaid-invoice due/cancellable predicates, future-cancellation anniversary date maths).
- Full documentation set: `foundation.md`, `README.md`, `usage.md`, `architecture.md`, `gotchas.md` (this changelog).

---

## Migration Guide

> _No migrations yet — this is the module's first documented release._
