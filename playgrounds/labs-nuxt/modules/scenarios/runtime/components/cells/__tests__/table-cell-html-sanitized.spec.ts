// -----------------------------------------------------------------------------
/**
 * @module cells/__tests__/table-cell-html-sanitized.spec
 * @description The refinement AC for the read overlay's rich fields: an email
 * `body` draws as SANITIZED HTML — the recorded markup is handed to the repo's
 * own `Sanitized` primitive and drawn as real elements, never escaped to text
 * and never dumped raw. The body is the field the history list never carries;
 * it lands only when the single email is fetched in full, and the detail
 * declares it through the same `TableCellHtml` renderer this proves.
 *
 * The value is the verbatim HTML staging returned for the recorded email — not
 * an authored markup string — so a renderer that stopped routing it through the
 * sanitizer, or started escaping it, turns these red.
 *
 * Negative control: `table-cell-html-sanitized.must-fail.patch`.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";
import text from "@upmind-automation/i18n/core/text-en.json";
import { Sanitized } from "@upmind-automation/upmind-ui";
import clientEmailHistory from "../../../../useClientReceivedEmails/client-email-history.scenario";
import { receivedEmailBody } from "../../../../../../tests/support/recorded-received-email";
import { CellDispatcher } from "../index";
import { find } from "lodash-es";
import type { TableCell } from "../../../scenario.types";

// -----------------------------------------------------------------------------

const messages = { en: { text } };

/** The body cell the history detail declares — read off the declaration, not restated. */
const bodyCell = find(clientEmailHistory.presentation.detail?.elements, {
  type: "TableCellHtml"
}) as TableCell;

const drawBody = () =>
  mount(CellDispatcher, {
    props: { element: bodyCell, row: { body: receivedEmailBody } },
    global: { plugins: [createI18n({ legacy: false, locale: "en", messages })] }
  });

// -----------------------------------------------------------------------------

describe("the email body draws as sanitized HTML", () => {
  it("has recorded markup to draw in the first place", () => {
    expect(bodyCell).toBeTruthy();
    expect(bodyCell.type).toBe("TableCellHtml");
    expect(receivedEmailBody).toContain("<table");
  });

  it("hands the recorded body to the repo's own sanitizer", () => {
    const sanitized = drawBody().findComponent(Sanitized);

    expect(sanitized.exists()).toBe(true);
    expect(sanitized.props("modelValue")).toBe(receivedEmailBody);
  });

  it("draws the markup as real elements, not escaped text", () => {
    const wrapper = drawBody();

    expect(wrapper.html()).toContain("<table");
    expect(wrapper.text()).not.toContain("<table");
  });
});
