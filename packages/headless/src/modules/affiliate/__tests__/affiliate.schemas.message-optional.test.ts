/**
 * @fileoverview affiliate.schemas — the withdrawal request form contract (AC19)
 *
 * ## Job To Be Done
 * Protect the withdrawal request form's required-field contract by driving
 * the REAL form validator, not by reading the schema's declared shape: a
 * client cannot submit a manual withdrawal with an empty or a whitespace-only
 * message (design.md §8.5, `useWithdrawalSchema()` — "message required,
 * minLength: 1, trim").
 *
 * ## What Breaks If These Fail
 * A client could submit a withdrawal request with an empty message. A
 * support ticket is raised (AC19) with nothing for staff to act on, and the
 * client gets no client-side field error telling them why.
 */
import { describe, it, expect } from "vitest";
import { useValidation } from "../../../utils/useValidation";
import { useWithdrawalSchema } from "../affiliate.schemas";
import type { ErrorObject } from "ajv";

/**
 * Checks the errors NAME the `message` field, not merely that some error
 * exists — a required-property error carries `params.missingProperty`, a
 * `minLength`/`trim` error carries `instancePath: "/message"`.
 */
function namesMessageField(errors: ErrorObject[]): boolean {
  return errors.some(
    error =>
      error.instancePath === "/message" ||
      error.params?.missingProperty === "message"
  );
}

describe("affiliate.schemas — useWithdrawalSchema, real validation", () => {
  const { validate } = useValidation();

  it("refuses an absent message", () => {
    const errors = validate(useWithdrawalSchema(), {});

    expect(errors.length).toBeGreaterThan(0);
    expect(namesMessageField(errors)).toBe(true);
  });

  it("refuses an empty message", () => {
    const errors = validate(useWithdrawalSchema(), { message: "" });

    expect(errors.length).toBeGreaterThan(0);
    expect(namesMessageField(errors)).toBe(true);
  });

  it("refuses a whitespace-only message (trim)", () => {
    const errors = validate(useWithdrawalSchema(), { message: "   " });

    expect(errors.length).toBeGreaterThan(0);
    expect(namesMessageField(errors)).toBe(true);
  });

  it("accepts a non-empty message", () => {
    const errors = validate(useWithdrawalSchema(), {
      message: "Please process my withdrawal."
    });

    expect(errors).toEqual([]);
  });
});
