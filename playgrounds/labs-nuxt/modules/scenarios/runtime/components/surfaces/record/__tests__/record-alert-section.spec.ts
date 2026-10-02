// -----------------------------------------------------------------------------
/**
 * @module surfaces/record/__tests__/record-alert-section.spec
 * @description The `alert` section kind's draws / blank / skeleton rule, read
 * off the registry entry its `kind` resolves to. An alert section draws the
 * FIRST of its alerts whose gate is open; with none open it is BLANK; and
 * because which banner applies is unknown until the record lands, a booting
 * alert draws NO placeholder skeleton.
 *
 * ## What Breaks If These Fail
 * An alert section draws an empty banner frame on a record none of its alerts
 * apply to, or draws a skeleton banner while the record boots — a banner the
 * user sees before the surface knows whether any alert is even due.
 */

import { describe, expect, it } from "vitest";
import { resolveRecordSection } from "../record.renderers";
import type { RecordGateReader } from "../record.types";
import type { RecordSectionDeclaration } from "../../../../scenario.types";

// -----------------------------------------------------------------------------

const alertSection = (
  alerts: { name: string; gate?: string }[]
): RecordSectionDeclaration =>
  ({
    kind: "alert",
    key: "banner",
    alerts: alerts.map(a => ({ ...a, i18n: { title: "notice.title" } }))
  }) as RecordSectionDeclaration;

const allowsOnly =
  (...open: string[]): RecordGateReader =>
  gate =>
    gate !== undefined && open.includes(gate);

const alertEntry = () => {
  const entry = resolveRecordSection(alertSection([]));
  if (!entry) throw new Error("the `alert` section kind resolves no renderer");
  return entry;
};

// -----------------------------------------------------------------------------

describe("the alert section draws only when one of its alerts' gates is open", () => {
  it("is blank when none of its gated alerts open", () => {
    const { isBlank } = alertEntry();

    expect(
      isBlank!(alertSection([{ name: "failed", gate: "hasError" }]), {}, () =>
        false
      )
    ).toBe(true);
  });

  it("draws when a gated alert opens", () => {
    const { isBlank } = alertEntry();

    expect(
      isBlank!(
        alertSection([{ name: "failed", gate: "hasError" }]),
        {},
        allowsOnly("hasError")
      )
    ).toBe(false);
  });

  it("draws whenever any one of several alerts opens, not only the first", () => {
    const { isBlank } = alertEntry();

    expect(
      isBlank!(
        alertSection([
          { name: "failed", gate: "hasError" },
          { name: "due", gate: "isPaymentDue" }
        ]),
        {},
        allowsOnly("isPaymentDue")
      )
    ).toBe(false);
  });

  it("always draws an ungated alert", () => {
    const { isBlank } = alertEntry();

    expect(isBlank!(alertSection([{ name: "placed" }]), {}, () => false)).toBe(
      false
    );
  });
});

describe("the alert section draws no skeleton while the record boots", () => {
  it("declares zero skeleton rows, so a booting record shows no banner frame", () => {
    expect(alertEntry().skeletonRows).toBe(0);
  });
});
