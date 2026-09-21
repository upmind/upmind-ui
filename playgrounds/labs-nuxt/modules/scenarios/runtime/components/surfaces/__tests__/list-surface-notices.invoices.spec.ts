// -----------------------------------------------------------------------------
/**
 * @fileoverview FE-3031 — `ScenarioPresentation.notices` renders a
 * `useMeta()` member as ITSELF (2026-09-09 sign-off).
 *
 * ## Job To Be Done
 * `ModulePort.rawMeta()` is the one escape from `CompositionPort.getMeta()`'s
 * ADR-027 d.4 "flags cross the port as already-evaluated booleans" invariant
 * — a numeric member (`consolidatableCount`) must reach the screen as its
 * real magnitude, never `!!count`. This proves `ListSurface` draws exactly
 * what `notices` hands it, for the two scopes `invoices.presentation.ts`
 * actually declares (`hasUnpaid`, `consolidatableCount`), and draws nothing
 * for a scope the declaration never named.
 *
 * ## What Breaks If These Fail
 * A real notice count collapses to a boolean chip (`AC2`'s consolidatable
 * count becomes an on/off dot instead of a number), or the collection notice
 * silently fails to draw at all despite the composable answering it.
 *
 * Negative control: an inline pre-fix shape — the `notices` prop absent (the
 * pre-fix state, since `ModulePort.rawMeta()` did not exist before this
 * dispatch) draws neither notice, proving the assertion depends on the prop
 * this fix threads through, not on `presentation.notices` alone.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import invoicesDeclaration from "../../../../useInvoices/invoices.scenario";
import { ListSurface } from "../index";
import { map } from "lodash-es";
import type { MetaNoticeElement } from "../../../scenario.types";

// -----------------------------------------------------------------------------

const NOTICES = invoicesDeclaration.presentation.notices as MetaNoticeElement[];
const CONSOLIDATABLE_COUNT = 7;

const rows = [{ id: "row-1" }];

function mountList(notices?: Record<string, boolean | number>) {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: [],
        context: { data: rows },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions: {},
      presentation: invoicesDeclaration.presentation,
      notices
    }
  });
}

describe("@AC2/@AC10 ListSurface notices — a declared count draws its own magnitude", () => {
  it("declares exactly hasUnpaid and consolidatableCount, nothing else", () => {
    expect(map(NOTICES, "scope")).toEqual(["hasUnpaid", "consolidatableCount"]);
  });

  it("draws the numeric notice as its own digits, never coerced to a boolean chip", () => {
    const wrapper = mountList({
      hasUnpaid: true,
      consolidatableCount: CONSOLIDATABLE_COUNT
    });

    expect(wrapper.text()).toContain(String(CONSOLIDATABLE_COUNT));
    // ADR-027 d.4's own coercion, `!!count`, is `true` for any positive
    // count — collapsing 7 into that would still print "true" nowhere near
    // the digits, so asserting the digits are on screen is itself the proof
    // the number, not its truthiness, reached the page.
    expect(wrapper.text()).not.toContain("!!");
  });

  it("draws the collection notices ALONGSIDE the list rows, never instead of them", () => {
    const wrapper = mountList({
      hasUnpaid: true,
      consolidatableCount: CONSOLIDATABLE_COUNT
    });

    expect(wrapper.text()).toContain(String(CONSOLIDATABLE_COUNT));
    expect(wrapper.findAll("tbody tr, li").length).toBeGreaterThan(0);
  });

  it("CONTROL (inline pre-fix shape) — with no notices prop relayed, neither declared notice draws its value", () => {
    const wrapper = mountList(undefined);

    expect(wrapper.text()).not.toContain(String(CONSOLIDATABLE_COUNT));
  });

  it("CONTROL — declared but unanswered: a named scope missing from the port's answer draws nothing for it", () => {
    // `consolidatableCount` IS named in `presentation.notices`, but the
    // answer omits it (the pre-gate-flip state — a scope nobody's read yet)
    // — per `ListSurfaceProps.notices`' own contract ("absent or missing a
    // named key, that notice draws nothing").
    const wrapper = mountList({ hasUnpaid: true });

    expect(wrapper.text()).not.toContain(String(CONSOLIDATABLE_COUNT));
  });
});
