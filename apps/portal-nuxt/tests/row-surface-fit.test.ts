// -----------------------------------------------------------------------------
/**
 * @module tests/row-surface-fit
 * @description A row's surface has to fit what is inside it.
 *
 * Two shapes were wrong on the walkthrough. A brand's own note rendered as
 * bare markdown directly under the page title, reading as the page's opening
 * copy rather than as a note ABOUT the page — it now sits on a muted surface.
 * And an alert sat alone inside a bordered PANEL, so the page drew a card
 * around a single notice and nothing else; an alert already carries its own
 * tone and border, so the panel was a second box holding nothing.
 *
 * Both are swept rather than spot-checked: `brandNoteRow` serves four pages,
 * and the banner-in-a-panel shape appeared twice — the email-history notice
 * the walkthrough found, and the delegate-invitation landing.
 */

import { describe, expect, it } from "vitest";
import {
  filter,
  flatMap,
  get,
  isObject,
  map,
  size,
  startsWith,
  values
} from "lodash-es";
import type { ContentConfig, ContentRowConfig } from "~/portal/types";
import { ROW_SURFACE } from "~/portal/content/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { brandNoteRow } from "~/portal/config/pager";
import { BANNER_MODULE_ID } from "~/portal/registry";
import { DATA_REF_ID } from "~/portal/mock/data-refs";

/** Every row of every page the shape composes — `pages`, not the singular fallback. */
function allRows(): ContentRowConfig[] {
  const pages = values(hostgridConfig.pages ?? {}) as ContentConfig[];
  return flatMap(pages, page => [...(page.rows ?? []), ...(page.aside ?? [])]);
}

/** The ref a row's own visibility hangs on, for naming it in a failure. */
function gateOf(row: ContentRowConfig): string {
  const gate = row.visible;
  if (gate === undefined || !isObject(gate)) return "ungated";
  return get(gate, "id", "ungated");
}

/** A brand's note is the row gated on one of the brand's `template-has-*` slots. */
function isBrandNote(row: ContentRowConfig): boolean {
  return startsWith(gateOf(row), "template-has-");
}

/** Whether a row's only content is the banner module. */
function isLoneBanner(row: ContentRowConfig): boolean {
  const slots = row.slots ?? [];
  const only = slots.at(0);
  const isSingle = size(slots) === 1;
  const isBanner = only?.kind === "module" && only.id === BANNER_MODULE_ID;
  return isSingle && isBanner;
}

describe("a brand's note reads as a note", () => {
  it("sits on a muted surface, not bare under the title", () => {
    const row = brandNoteRow(
      DATA_REF_ID.TEMPLATE_DASHBOARD_MARKDOWN,
      DATA_REF_ID.TEMPLATE_HAS_DASHBOARD
    );

    expect(row.surface).toBe(ROW_SURFACE.MUTED);
  });

  it("carries that surface on every page that serves one", () => {
    // A brand note is the row gated on a `template-has-*` ref. One builder
    // makes them all, so this is the guard against a page hand-rolling its
    // own note row and landing back on bare markdown.
    const notes = filter(allRows(), isBrandNote);
    const bare = filter(notes, row => row.surface !== ROW_SURFACE.MUTED);

    expect(size(notes)).toBeGreaterThan(0);
    expect(map(bare, gateOf)).toEqual([]);
  });
});

describe("an alert stands on its own", () => {
  it("is never wrapped in a panel, on any page of the shape", () => {
    const boxed = filter(
      allRows(),
      row => isLoneBanner(row) && row.surface === ROW_SURFACE.PANEL
    );

    // Named, so a failure says WHICH page drew a card around one notice.
    expect(map(boxed, row => row.header?.title ?? "untitled")).toEqual([]);
  });

  it("finds the lone-banner rows it is grading, or it proves nothing", () => {
    expect(size(filter(allRows(), isLoneBanner))).toBeGreaterThan(0);
  });
});
