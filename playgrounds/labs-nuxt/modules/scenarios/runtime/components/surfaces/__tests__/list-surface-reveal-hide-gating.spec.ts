// -----------------------------------------------------------------------------
/**
 * @fileoverview `reveal` and `hide` are complementary secret-only controls,
 * gated on `meta.isSecret` AND `meta.isRevealed`:
 *
 * - `reveal` (decrypt + show) shows only for a secret that is NOT yet revealed.
 * - `hide` (re-hide) shows only for a secret that IS currently revealed.
 * - a plain note offers neither.
 *
 * ## What Breaks If This Fails
 * Both controls show at once on a secret (you can "reveal" an already-revealed
 * value, or "hide" one that is not shown), or a plain note offers a reveal that
 * has nothing to decrypt.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import clientNotes from "../../../../useClientNotes/client-notes.scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface } from "../index";
import { getRow } from "./table-geometry";
import { keys } from "lodash-es";
import type { ListRow } from "../ListSurface.types";
import type { SurfaceActions } from "../surface.types";

// -----------------------------------------------------------------------------

const { presentation } = clientNotes;

const secretHidden: ListRow = {
  id: "a1",
  label: "Unrevealed secret",
  note: "",
  encrypted: true,
  meta: {
    isSecret: true,
    isRevealed: false,
    isPinned: false,
    isHiddenFromClient: false,
    isLinkedToProduct: false
  }
};

const secretRevealed: ListRow = {
  id: "b2",
  label: "Revealed secret",
  note: "S3CR3T-plaintext",
  encrypted: true,
  meta: {
    isSecret: true,
    isRevealed: true,
    isPinned: false,
    isHiddenFromClient: false,
    isLinkedToProduct: false
  }
};

const plainNote: ListRow = {
  id: "c3",
  label: "A plain note",
  note: "nothing hidden",
  encrypted: false,
  meta: {
    isSecret: false,
    isRevealed: false,
    isPinned: false,
    isHiddenFromClient: false,
    isLinkedToProduct: false
  }
};

const LIVE_ACTIONS = {
  reveal: vi.fn(),
  hide: vi.fn(),
  convert: vi.fn(),
  setPinned: vi.fn(),
  remove: vi.fn(),
  refresh: vi.fn()
} as unknown as SurfaceActions;

function mountList() {
  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: keys(LIVE_ACTIONS),
        context: { data: [secretHidden, secretRevealed, plainNote] },
        meta: { isEmpty: false, isFiltered: false }
      },
      actions: LIVE_ACTIONS,
      presentation,
      handoffs: RESOLVED_HANDOFFS
    }
  });
}

const has = (
  wrapper: ReturnType<typeof mountList>,
  row: number,
  name: string
) => getRow(wrapper, row).find(`[data-test-value="${name}"]`).exists();

// -----------------------------------------------------------------------------

describe("reveal/hide gate on isSecret AND isRevealed", () => {
  it("an unrevealed secret offers reveal, never hide", () => {
    const wrapper = mountList();
    expect(has(wrapper, 0, "reveal")).toBe(true);
    expect(has(wrapper, 0, "hide")).toBe(false);
  });

  it("a revealed secret offers hide, never reveal", () => {
    const wrapper = mountList();
    expect(has(wrapper, 1, "hide")).toBe(true);
    expect(has(wrapper, 1, "reveal")).toBe(false);
  });

  it("a plain note offers neither reveal nor hide", () => {
    const wrapper = mountList();
    expect(has(wrapper, 2, "reveal")).toBe(false);
    expect(has(wrapper, 2, "hide")).toBe(false);
  });
});
