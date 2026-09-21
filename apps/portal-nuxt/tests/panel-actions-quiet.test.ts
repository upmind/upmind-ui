// -----------------------------------------------------------------------------
/**
 * @module tests/panel-actions-quiet
 * @description A panel's header offers controls or it offers nothing.
 *
 * The header's action slot took an `emptyTitle`, so a group whose data ref came
 * back empty painted an EmptyState where the control belongs — "Nothing to
 * add", "No security controls", "No delegate controls". Read as a dead button,
 * and on the pages it actually reached it was simply wrong: the delegates list
 * carries its own "Invite delegate", and the detail page's group empties only
 * when the route names no delegate at all.
 *
 * Emptiness belongs to the panel's BODY, which already says "No notes yet".
 * A header with nothing to offer says nothing.
 *
 * Swept rather than spot-checked: the helper serves nine panels across the
 * account pillar, and the copy was written nine times.
 */

import { describe, expect, it } from "vitest";
import { flatMap, get, isObject, map, values } from "lodash-es";
import type { ContentConfig, ContentRowConfig } from "~/portal/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { BUTTON_MODULE_ID } from "~/portal/registry";

type SlotLike = Record<string, unknown>;

function allRows(): ContentRowConfig[] {
  const pages = values(hostgridConfig.pages ?? {}) as ContentConfig[];
  return flatMap(pages, page => [...(page.rows ?? []), ...(page.aside ?? [])]);
}

/** Every module a row hangs in its header's action slot, flattened. */
function headerActionModules(): SlotLike[] {
  return flatMap(allRows(), row => {
    const slot = row.header?.actions;
    if (!isObject(slot)) return [];
    const members = get(slot, "members");
    if (Array.isArray(members)) return members as SlotLike[];
    return [slot as SlotLike];
  });
}

describe("a panel header offers controls or nothing", () => {
  it("hangs no empty-state copy on an action group", () => {
    const buttons = headerActionModules().filter(
      module => get(module, "id") === BUTTON_MODULE_ID
    );
    const withCopy = buttons.filter(
      module => get(module, "props.emptyTitle") !== undefined
    );

    // Named, so a failure says which panel would paint a dead control.
    expect(map(withCopy, module => get(module, "props.label"))).toEqual([]);
    expect(buttons.length).toBeGreaterThan(0);
  });
});
