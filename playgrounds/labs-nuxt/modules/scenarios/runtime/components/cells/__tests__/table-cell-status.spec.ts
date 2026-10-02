// -----------------------------------------------------------------------------
/**
 * @module cells/__tests__/table-cell-status.spec
 * @description `TableCellStatus` — the record's one status, drawn as a status
 * badge through the dispatcher that resolves a cell by its declared `type`. The
 * registration is proven by `table-cell-tester.spec`; this proves the cell the
 * registration points at actually draws the model's status, and draws it as a
 * badge rather than as the plain text a `TableCellText` would.
 *
 * ## What Breaks If These Fail
 * A declared status cell renders empty or as unstyled text, so a contract's
 * state stops reading as a status on the record it belongs to.
 */

import { Badge } from "@upmind/ui";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import text from "@upmind-automation/i18n/core/text-en.json";
import { CellDispatcher } from "../index";
import type { TableCell } from "../../../scenario.types";

// -----------------------------------------------------------------------------

const statusCell = {
  type: "TableCellStatus",
  scope: "#/properties/status"
} as TableCell;

const textCell = {
  type: "TableCellText",
  scope: "#/properties/status"
} as TableCell;

const row = { status: "active" };

const draw = (element: TableCell) =>
  mount(CellDispatcher, {
    props: { element, row },
    global: {
      plugins: [
        createI18n({ legacy: false, locale: "en", messages: { en: { text } } })
      ]
    }
  });

// -----------------------------------------------------------------------------

describe("TableCellStatus draws the record's status as a badge", () => {
  it("draws the status value the cell's scope names", () => {
    expect(draw(statusCell).text()).toContain("active");
  });

  it("draws it as a badge, which the plain text cell does not", () => {
    expect(draw(statusCell).findComponent(Badge).exists()).toBe(true);
    expect(draw(textCell).findComponent(Badge).exists()).toBe(false);
  });
});
