// -----------------------------------------------------------------------------
/**
 * @fileoverview contract-product cancellation-body mappers — custom fields on
 * the wire (unit)
 *
 * ## Job To Be Done
 * The product-manager cancellation writes carry the client's custom fields
 * to the wire: `stopRenewing` (`toSoftCancelBody` -> `modify_renew`),
 * `scheduleCancellation` (`toScheduleCancellationBody` -> `schedule-cancel`)
 * and `requestCancellation` (`toRequestCancellationBody` -> `cancel/request`).
 * `customFields` is a `CustomFieldModel` (code -> value) sent verbatim as
 * `custom_fields`, never diffed through the edit-flow helper; an empty object,
 * or none, emits no `custom_fields` key. The soft-cancel body also carries the
 * `renew` flag and the schedule body the chosen `future_cancellation_date`,
 * with `reason` mapped to `cancellation_reason` only when supplied.
 *
 * ## What Breaks If These Fail
 * A client's cancellation custom fields (or reason) are dropped or reshaped, or
 * an empty bag is posted where the server expects the key withheld.
 */

import { describe, expect, it } from "vitest";
import {
  toRequestCancellationBody,
  toScheduleCancellationBody,
  toSoftCancelBody
} from "../contract-product.mappers";
import type {
  RequestCancellationModel,
  ScheduleCancellationModel,
  SoftCancelModel
} from "..";

// -----------------------------------------------------------------------------

describe("toSoftCancelBody — custom fields travel verbatim (D6/D7)", () => {
  it("sends customFields as custom_fields, key for key, beside renew and reason", () => {
    const model: SoftCancelModel = {
      renew: false,
      reason: "too expensive",
      customFields: { cancel_reason_code: "price", notes: "thanks" }
    };

    const body = toSoftCancelBody(model);

    expect(body.custom_fields).toEqual({
      cancel_reason_code: "price",
      notes: "thanks"
    });
    expect(body.renew).toBe(false);
    expect(body.cancellation_reason).toBe("too expensive");
  });

  it("emits no custom_fields key for an empty object", () => {
    const body = toSoftCancelBody({ renew: false, customFields: {} });

    expect("custom_fields" in body).toBe(false);
  });

  it("emits no custom_fields key when none is supplied", () => {
    const body = toSoftCancelBody({ renew: true });

    expect("custom_fields" in body).toBe(false);
  });
});

describe("toScheduleCancellationBody — custom fields travel verbatim (D6/D7)", () => {
  it("sends customFields as custom_fields, key for key, beside the chosen date", () => {
    const model: ScheduleCancellationModel = {
      futureCancellationDate: "2027-01-01",
      reason: "moving on",
      customFields: { cancel_reason_code: "moving_away" }
    };

    const body = toScheduleCancellationBody(model);

    expect(body.custom_fields).toEqual({ cancel_reason_code: "moving_away" });
    expect(body.future_cancellation_date).toBe("2027-01-01");
    expect(body.cancellation_reason).toBe("moving on");
  });

  it("emits no custom_fields key for an empty object", () => {
    const body = toScheduleCancellationBody({
      futureCancellationDate: "2027-01-01",
      customFields: {}
    });

    expect("custom_fields" in body).toBe(false);
  });

  it("emits no custom_fields key when none is supplied", () => {
    const body = toScheduleCancellationBody({
      futureCancellationDate: "2027-01-01"
    });

    expect("custom_fields" in body).toBe(false);
  });
});

const PRODUCT_ID = "785d26e9-6783-d169-678a-314502e70439";

describe("toRequestCancellationBody — custom fields travel verbatim (D6/D7, R33)", () => {
  it("sends customFields as custom_fields, key for key, beside product_ids and reason", () => {
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
