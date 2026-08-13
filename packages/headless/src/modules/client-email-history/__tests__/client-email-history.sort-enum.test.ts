// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the sortable-properties enum stays on
 * the barrel (AC-20)
 *
 * Colocated negative control: `client-email-history.sort-enum.must-fail.patch`
 * removes `ReceivedEmailsSortableProperties` from the named re-export list.
 * This is the ONE assertion that patch must flip red.
 */

import { describe, expect, it } from "vitest";
import { ReceivedEmailsSortableProperties } from "..";

// -----------------------------------------------------------------------------

describe("client-email-history barrel — the sort-order naming (AC-20)", () => {
  it("exports ReceivedEmailsSortableProperties with its documented members", () => {
    expect(ReceivedEmailsSortableProperties.DEFAULT).toBe("created_at");
    expect(ReceivedEmailsSortableProperties.SUBJECT).toBe("subject");
  });
});
