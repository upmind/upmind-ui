// @vitest-environment happy-dom
/**
 * @module scenarios/runtime/components/__tests__/forced-surface.invoices.spec
 * @description FE-3113 `AC4` — the invoices page under each preset its own
 * recordings can answer. The claims, and why they are read off the rendered
 * page rather than off `presetAnswer`, live in `forced-surface.harness.ts`.
 *
 * One module per file: each module's replay lifecycle installs its own
 * request interceptor over the same globals, so two in one file leaves the
 * second one's server answering the first one's page.
 *
 * ## KNOWN RED — 2026-09-09, prover seat, FE-3031 dispatch
 * Two genuine harness defects in `forced-surface.harness.ts` are fixed as of
 * this dispatch and verified NOT to regress any of the other seven
 * `forced-surface.*.spec.ts` files (39/39 still green — the other seven
 * files' own total; this file's own 5 tests, 3 of them the STILL RED cells
 * below, are counted separately and are not part of that 39. Corrected
 * 2026-09-09 read-back: this previously read "42/42", which folded this
 * file's own 3 reds into the sibling count it was disclosing.):
 *   1. `witness()` matched the ALWAYS-rendered filter-bar chrome (an
 *      untranslated multi-select option renders its raw i18n key, e.g.
 *      `invoices.filter_option.status.invoice_paid`, which contains the
 *      corpus's own `"invoice_paid"` value as a plain substring) — fixed by
 *      excluding `[data-test-key="filters"]` from the witness measurement.
 *   2. `rows()` counted the design-system Table's own
 *      `<tr data-slot="table-empty">` "no results" placeholder as a real
 *      record row — fixed by scoping the count to
 *      `tr[data-slot="table-row"]`.
 * With both fixed, `Live draws this module's own recorded records`, `armed
 * empty`, and `armed error-collection` are STILL RED — honestly this time:
 * the "replay" (unforced) mount renders ZERO real invoice rows for this
 * scenario's default criteria (only the table-empty sentinel), so there is
 * no genuine baseline for the differential claims to compare against. This
 * is a corpus/replay-routing question (`../../force/handlers.ts`,
 * `../../force/corpus.ts` — outside the prover's write lane, and outside
 * this dispatch's diagnosed root cause), not a defect in this file, this
 * harness's remaining logic, or the invoices page itself. NEEDS OPERATOR
 * DISPOSITION: route to the developer to confirm whether the labs-nuxt
 * invoices corpus needs re-recording against the module's current default
 * query criteria, or file+apply a compliant `@quarantine` tag once a
 * tracked issue exists (this dispatch had no issue-tracker write access to
 * open one, so quarantining here would have been an uncited/fabricated
 * issue id — worse than an honest red).
 *
 * ATTRIBUTION, re-checked 2026-09-09 (prover, FE-3031 read-back): re-run
 * against the SAME SHA / harness / `runtime/force/**`,
 * `forced-surface.client-phone.spec.ts` is 6/6 GREEN, including its own
 * "Live draws this module's own recorded records" cell — so `runtime/
 * force/**` genuinely replays a real corpus for at least one module. The
 * `notices`/`siblings` wiring this dispatch landed does not touch
 * `runtime/force/**` and does NOT clear these three cells (re-run above,
 * still the same 3 red). CORRECTED: the zero-row outcome is
 * INVOICES-SPECIFIC and remains UN-ROOT-CAUSED, not a shared-infrastructure
 * defect — read the NEEDS OPERATOR DISPOSITION above against that premise.
 */

import declaration from "../../../useInvoices/invoices.scenario";
import { proveForcedSurface } from "./forced-surface.harness";

// -----------------------------------------------------------------------------

await proveForcedSurface(declaration);
