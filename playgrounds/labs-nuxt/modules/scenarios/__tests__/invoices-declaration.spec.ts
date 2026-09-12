// -----------------------------------------------------------------------------
/**
 * @fileoverview invoices declaration — the binding claim the scenario makes
 *
 * ## Job To Be Done
 * A scenario declares WHAT it boots, HOW it draws, and WHICH module it tracks.
 * This spec asserts that claim against the declared surface: every column
 * draws through a registered cell renderer, every non-detail action names a
 * LIVE `useInvoices` capability, the bound composables exist (this is the
 * first scenario in the tree to declare `useDetail`), and the tracked module
 * owns a committed feature naming the same scenario key its step catalog does
 * (`invoices.scenario.ts`'s `key` vs `invoices.steps.ts`'s `INVOICES_SCENARIO`
 * — the read join the client-email-history drive-by taught this factory to
 * check explicitly: that module's page and catalog disagreed on
 * `"client_email_history"` vs `"client-email-history"`).
 *
 * KEY PIN (B2, 2026-09-09): `INVOICES_SCENARIO` used to be imported by a deep
 * cross-package path into `packages/headless/src/modules/invoices/__tests__/`
 * — a `@workspace/no-cross-package-path-imports` violation, since that file is
 * private test scaffolding with no published specifier reaching it (it is not
 * re-exported from `@upmind-automation/headless`'s barrel, and never should
 * be — it is not production surface). The assertion below now pins the
 * literal `"invoices"` directly, which `invoices.steps.ts`'s own
 * `INVOICES_SCENARIO = "invoices"` also hard-codes verbatim.
 * **This trades a MECHANICAL cross-file drift check for a MANUAL one**: the
 * two literals can no longer be caught disagreeing at test time the way the
 * client-email-history incident this file's own docstring names was caught.
 * If that mechanical pin needs restoring, the durable fix is a published
 * export both packages may legitimately import (e.g. a shared scenario-key
 * constants module, or re-exporting the key from headless's own barrel) —
 * not a deep import into a private test file. Flagged rather than silently
 * dropped; not this dispatch's call to make unilaterally.
 *
 * ## What Breaks If These Fail
 * The scenario boots with a column no renderer owns, an action nobody
 * handles, a module identity that matches nothing, or a control claiming a
 * capability this module never shipped — a page that looks intact and
 * silently does nothing.
 *
 * Negative controls:
 * `packages/headless/src/modules/invoices/__tests__/invoices.page-control-name-drift.must-fail.patch`
 * is the developer's — it renames `refreshAfterPayment`'s drawn `name` to a
 * non-member, primarily targeting the "every non-detail action names a live
 * invoices capability" assertion below. Applied blind in this dispatch's own
 * run: it flips that assertion RED, plus two collateral assertions IN THIS
 * SAME FILE that also key on the literal name `refreshAfterPayment`
 * ("declares the expected presentation actions",
 * "draws refreshAfterPayment and invalidate in the OVERFLOW") — all three
 * are the same single-line mutation read three ways, not an unrelated blast
 * radius; nothing outside this file reacts. Reverted, confirmed green again.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { useInvoices } from "@upmind-automation/headless";
import declaration from "../useInvoices/invoices.scenario";
import { every, filter, flatMap, keys, map, reject, some } from "lodash-es";
import type { ScenarioAction, TableCell } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const MODULE_ROOT = join(
  import.meta.dirname,
  "../../../../../packages/headless/src/modules",
  declaration.tracks ?? ""
);

const allCells = (): TableCell[] =>
  flatMap(
    filter(
      [
        declaration.presentation.table?.elements,
        declaration.presentation.card?.elements,
        declaration.presentation.detail?.elements
      ],
      Boolean
    ) as TableCell[][]
  );

const allActions = (): ScenarioAction[] =>
  declaration.presentation.actions?.elements ?? [];

const CELL_RENDERERS = new Set([
  "TableCellText",
  "TableCellHtml",
  "TableCellDate",
  "TableCellIcon",
  "TableCellBadges"
]);

/**
 * The collection's live capability map — DERIVED off
 * `useInvoices().as("self").useActions()`'s own member names, never
 * transcribed. A hand-typed list cannot catch the module LOSING a member
 * (the standing objection this replaces a hand-typed 10-of-13 list for: it
 * drifted stale within one commit of `filterBy`/`nextPage`/`prevPage`
 * landing, and nothing caught it). `view` is the documented exception — the
 * detail overlay, never a live member of either composable.
 */
const LIVE_CAPABILITIES = new Set(keys(useInvoices().as("self").useActions()));

const NON_CAPABILITY_ACTIONS = new Set(["view"]);

// -----------------------------------------------------------------------------

describe("invoices declaration — the declaration draws only what it declares", () => {
  it("declares useList AND useDetail — no useMutate, the module ships no manager", () => {
    expect(declaration.useList).toBeDefined();
    expect(declaration.useDetail).toBeDefined();
    expect((declaration as Record<string, unknown>).useMutate).toBeUndefined();
  });

  it("declares no route — the directory IS the route", () => {
    expect((declaration as Record<string, unknown>).route).toBeUndefined();
  });

  it("draws every column through a registered cell renderer", () => {
    const cells = allCells();
    expect(cells.length).toBeGreaterThan(0);
    expect(every(cells, cell => CELL_RENDERERS.has(cell.type))).toBe(true);
  });

  it("enables criteria persistence", () => {
    expect(declaration.persistCriteria).toBe(true);
  });
});

describe("invoices declaration — the scenario key and the catalog agree", () => {
  it("declares key 'invoices', matching the catalog's INVOICES_SCENARIO literal (see the KEY PIN note above)", () => {
    expect(declaration.key).toBe("invoices");
  });

  it("tracks 'invoices' under packages/headless/src/modules", () => {
    expect(declaration.tracks).toBe("invoices");
    expect(existsSync(MODULE_ROOT)).toBe(true);
  });
});

describe("invoices declaration — every non-detail action names a live capability", () => {
  it("declares at least one action", () => {
    expect(allActions().length).toBeGreaterThan(0);
  });

  it("the derived capability map carries every useActions() member, none lost", () => {
    expect(LIVE_CAPABILITIES).toEqual(
      new Set([
        "assignPaymentMethod",
        "destroy",
        "filterBy",
        "filterConsolidatable",
        "filterCreditNotes",
        "invalidate",
        "isReady",
        "nextPage",
        "prevPage",
        "refresh",
        "refreshAfterPayment",
        "reset",
        "setCriteria",
        "sortBy"
      ])
    );
  });

  // The central lesson this run's mutant exists to guard against: a control
  // whose `name` matches nothing the module actually exposes draws and then
  // fails. `view` is the sanctioned exception (the detail overlay); every
  // OTHER action must name a member `LIVE_CAPABILITIES` actually carries.
  it("every non-detail action names a live invoices capability", () => {
    const pressable = reject(
      allActions(),
      action => !!action.detail || NON_CAPABILITY_ACTIONS.has(action.name)
    );
    expect(pressable.length).toBeGreaterThan(0);
    expect(
      map(
        reject(pressable, action => LIVE_CAPABILITIES.has(action.name)),
        "name"
      ),
      "Action(s) naming no live capability — a control that draws and then fails"
    ).toEqual([]);
  });

  it("declares the expected presentation actions", () => {
    const actionNames = map(allActions(), "name");
    for (const expected of [
      "refresh",
      "filterConsolidatable",
      "filterCreditNotes",
      "refreshAfterPayment",
      "invalidate",
      "view"
    ]) {
      expect(actionNames).toContain(expected);
    }
  });

  it("declares exactly 6 distinct drawn controls — assignPaymentMethod withdrawn", () => {
    const actionNames = map(allActions(), "name");
    expect(new Set(actionNames).size).toBe(6);
    expect(actionNames).not.toContain("assignPaymentMethod");
  });

  it("draws filterCreditNotes twice — header and row-scoped (AC-7)", () => {
    const filterCreditNotesActions = filter(
      allActions(),
      action => action.name === "filterCreditNotes"
    );
    expect(filterCreditNotesActions).toHaveLength(2);
  });

  it("draws refresh and filterConsolidatable in the HEADER", () => {
    for (const name of ["refresh", "filterConsolidatable"]) {
      const action = allActions().find(candidate => candidate.name === name);
      expect(action?.placement).toBe("header");
    }
  });

  it("draws refreshAfterPayment and invalidate in the OVERFLOW", () => {
    for (const name of ["refreshAfterPayment", "invalidate"]) {
      const action = allActions().find(candidate => candidate.name === name);
      expect(action?.placement).toBe("overflow");
    }
  });

  it("view opens the read-only detail overlay, not a live action", () => {
    const view = allActions().find(action => action.name === "view");
    expect(view?.detail).toBe(true);
  });
});

describe("invoices declaration — presentation covers the expected elements", () => {
  it("table declares 10 columns, ending with a locked icon", () => {
    const elements = declaration.presentation.table?.elements ?? [];
    expect(elements).toHaveLength(10);
    expect(elements.at(-1)?.type).toBe("TableCellIcon");
  });

  it("table declares exactly one attribution badges column, with all four flags", () => {
    const badgeCells = filter(
      declaration.presentation.table?.elements,
      cell => cell.type === "TableCellBadges"
    );
    expect(badgeCells).toHaveLength(1);
    const flags = map(
      (badgeCells[0] as { options: { badges: { flag: string }[] } }).options
        .badges,
      "flag"
    );
    expect(flags).toEqual(
      expect.arrayContaining([
        "isOwn",
        "isChildOfClient",
        "isDelegated",
        "isSettleable"
      ])
    );
  });

  it("card declares a TITLE slot", () => {
    const slots = map(declaration.presentation.card?.elements, "options.slot");
    expect(some(slots, slot => slot === "title")).toBe(true);
  });

  it("detail exceeds the table's own element count (a full record, not a list row)", () => {
    const detailCount = declaration.presentation.detail?.elements.length ?? 0;
    const tableCount = declaration.presentation.table?.elements.length ?? 0;
    expect(detailCount).toBeGreaterThan(tableCount);
  });
});

describe("invoices declaration — the known caveats, encoded honestly", () => {
  // AC-1 (design.md): `refreshUnpaidAmount` is live on
  // `useInvoice().useActions()`, but the runtime's actions channel binds the
  // LIST cell only (`useTableChannel.ts:118-120`) and `DetailUischema` carries
  // no actions member — there is no control this page could draw for it.
  it("draws no control named refreshUnpaidAmount — readable in the detail, not pressable", () => {
    const actionNames = map(allActions(), "name");
    expect(actionNames).not.toContain("refreshUnpaidAmount");

    // "Readable in the detail" is now a real, carried claim (2026-09-09
    // sign-off), not just this test's own comment: the detail declares the
    // context-sibling channel AND a scoped element reading through it.
    const detail = declaration.presentation.detail as
      | { siblings?: string[]; elements: TableCell[] }
      | undefined;
    expect(detail?.siblings).toContain("unpaidAmount");
    expect(
      some(detail?.elements, element =>
        String(element.scope).startsWith("#/properties/unpaidAmount/")
      )
    ).toBe(true);
  });

  // AC-4 (design.md D1 / requirements.md): assigning a SPECIFIC method needs a
  // payment-method picker from `payment-details`, out of scope (PN-1) — so no
  // handoff exists for it.
  it("declares no handoff — AC-4's assign-a-specific-method half has no picker channel", () => {
    expect((declaration as Record<string, unknown>).handoff).toBeUndefined();
  });

  // AC-4 clear half (withdrawn): the runtime's generic row press
  // (`props.actions[action.name](row.id)`) supplies only `invoiceId` — a
  // clear needs the explicit `null` second argument the single-arg channel
  // cannot carry. `assignPaymentMethod` stays a live `useInvoices` capability
  // (proven at the integration layer); it is simply not a page control here.
  it("draws no control named assignPaymentMethod — the actions channel cannot carry the explicit-null clear argument", () => {
    const actionNames = map(allActions(), "name");
    expect(actionNames).not.toContain("assignPaymentMethod");
  });
});
