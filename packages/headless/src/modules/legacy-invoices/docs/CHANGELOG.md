# Legacy Invoices Changelog

All notable changes to the legacy-invoices module.

## [Unreleased]

### Added

- Net-new module: `useLegacyInvoices` (collection) and `useLegacyInvoice`
  (single read), both client × self only — no `.for()` retarget compiles on
  either composable, from application code.
- List, filter (`number`, `total_amount`, `create_datetime`, each with its own
  operator set), sort (`create_datetime` | `total_amount`), and paginate an
  archive of imported invoices.
- Read one imported invoice in full, including its preserved original
  document, kept whole.
- Five derived record conditions on the single read: `isPaid`, `isOverdue`,
  `isCredited`, `isStaged`, `isProforma`.
- Download an imported invoice's PDF (`downloadPdf`), with a typed
  `LegacyInvoiceDocumentNotReadyError` on a 404 "still generating" response.
- Read-only surface: no pay, cancel, refund, share, or edit member exists
  anywhere on either composable.

### Known, accepted divergences from the legacy application (see `gotchas.md`)

- A filter or sort write resets the list to its first page; the legacy
  application keeps the reader's page.
- An over-shot page request recovers onto the **last** valid page; the
  legacy application recovers onto the first.
- The `number` filter column's `like` operator is contains-only; no anchored
  prefix/suffix match is offered.

### Known limitation

- The archive-availability flag (`hasLegacyInvoices`) can read `false` for a
  client who does in fact own imported invoices, until the signed-in
  identity read is confirmed to include the relation the legacy application
  itself relies on.
