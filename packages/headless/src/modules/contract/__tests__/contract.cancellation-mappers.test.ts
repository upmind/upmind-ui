// -----------------------------------------------------------------------------
/**
 * @fileoverview contract cancellation-body mapper — custom fields on the wire
 * (unit, AC-6 / ruling R28-D6/D7)
 *
 * ## Job To Be Done
 * `requestCancellation` carries the client's custom fields to
 * `POST contracts/{id}/cancel/request`. Ruling R28 (amendment 2026-09-23) and
 * operator decisions D6/D7 fix HOW: `customFields` is a `CustomFieldModel` — a
 * plain code -> value object — sent verbatim as `custom_fields`, exactly as
 * legacy sends it (`contractCancellation.ts:696-705`), NOT diffed through
 * `mapCustomFieldValuesToRequest` (that helper is for the edit flow, and a
 * cancellation is a new submission). An empty object, or none at all, emits no
 * `custom_fields` key so the server is never handed a hollow bag.
 *
 * ## What Breaks If These Fail
 * A client's cancellation custom fields are dropped, reshaped, or an empty bag
 * is posted where the server expects the key withheld — the capture the brand
 * requires on a hard cancellation is lost or malformed.
 */

import { describe, expect, it } from "vitest";
import { toRequestCancellationBody } from "../contract.mappers";
import type { RequestCancellationModel } from "..";

// -----------------------------------------------------------------------------

const PRODUCT_ID = "785d26e9-6783-d169-678a-314502e70439";

describe("toRequestCancellationBody — custom fields travel verbatim (D6/D7)", () => {
  it("sends customFields as custom_fields, key for key, with no reshaping", () => {
    const model: RequestCancellationModel = {
      productIds: [PRODUCT_ID],
      reason: "no longer needed",
      customFields: { cancel_reason_code: "moving_away", notes: "bye" }
    };

    const body = toRequestCancellationBody(model);

    expect(body.custom_fields).toEqual({
      cancel_reason_code: "moving_away",
      notes: "bye"
    });
    expect(body.product_ids).toEqual([PRODUCT_ID]);
    expect(body.cancellation_reason).toBe("no longer needed");
  });

  it("emits no custom_fields key when the model carries an empty object", () => {
    const body = toRequestCancellationBody({
      productIds: [PRODUCT_ID],
      customFields: {}
    });

    expect("custom_fields" in body).toBe(false);
  });

  it("emits no custom_fields key when the model carries none", () => {
    const body = toRequestCancellationBody({ productIds: [PRODUCT_ID] });

    expect("custom_fields" in body).toBe(false);
  });
});
