// -----------------------------------------------------------------------------
/**
 * @fileoverview payment utils — the cross-origin hand-off form (unit, AC-5/AC-7)
 *
 * ## Job To Be Done
 * AC-5 says a client whose bank wants confirmation "is given what I need in
 * order to confirm it with my bank". AC-7 says backing out at the bank takes no
 * money. Both hand off to a third-party origin, and the only carrier this
 * module has for that hand-off is {@link submitViaForm}. These tests pin the
 * carrier: the destination it posts to, the method it uses, and that every
 * field the caller supplied actually leaves with the request.
 *
 * A field silently dropped here is a confirmation the bank cannot complete, and
 * a cancel the provider never sees — the money question of AC-7.
 *
 * ## What Breaks If These Fail
 * A 3-D Secure confirmation lands at the provider with a missing form field and
 * the bank rejects it, or a client who backed out is never returned to the
 * cancel URL and the payment is left in limbo.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Methods, Targets } from "@upmind-automation/types";
import { submitViaForm } from "../payment.utils";

// -----------------------------------------------------------------------------

const APPROVAL_URL = "https://3ds.provider.test/authenticate";

/**
 * jsdom does not implement form submission, so the real `submit` throws
 * "Not implemented". Capture the form at the moment it is submitted — after
 * that call the util removes it from the document, so reading it later reads
 * nothing.
 */
function captureSubmittedForm(): () => HTMLFormElement {
  let captured: HTMLFormElement | undefined;

  vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(function (
    this: HTMLFormElement
  ) {
    captured = this.cloneNode(true) as HTMLFormElement;
  });

  return () => {
    if (!captured) throw new Error("submitViaForm never submitted a form");
    return captured;
  };
}

/** The name → value pairs the submitted form actually carries. */
function submittedFields(form: HTMLFormElement): Record<string, string> {
  const pairs: Record<string, string> = {};
  for (const input of form.querySelectorAll("input")) {
    pairs[input.getAttribute("name") ?? ""] = input.getAttribute("value") ?? "";
  }
  return pairs;
}

// -----------------------------------------------------------------------------

describe("submitViaForm — the bank hand-off carrier (AC-5, AC-7)", () => {
  let submitted: () => HTMLFormElement;

  beforeEach(() => {
    submitted = captureSubmittedForm();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("AC-5 posts to the provider URL with every field the caller supplied", () => {
    submitViaForm({
      fields: { MD: "merchant-data-123", PaReq: "pa-request-blob" },
      method: Methods.POST,
      url: APPROVAL_URL
    });

    const form = submitted();

    expect(form.getAttribute("action")).toBe(APPROVAL_URL);
    expect(form.getAttribute("method")).toBe(Methods.POST);
    expect(submittedFields(form)).toEqual({
      MD: "merchant-data-123",
      PaReq: "pa-request-blob"
    });
  });

  it("AC-5 defaults to a GET in the current window when the caller states neither", () => {
    submitViaForm({ url: APPROVAL_URL });

    const form = submitted();

    expect(form.getAttribute("method")).toBe(Methods.GET);
    expect(form.getAttribute("target")).toBe(Targets.SELF);
  });

  it("AC-5 honours an explicit target so a provider can demand a new window", () => {
    submitViaForm({ url: APPROVAL_URL, target: Targets.BLANK });

    expect(submitted().getAttribute("target")).toBe(Targets.BLANK);
  });

  it("AC-7 carries a cancel hand-off with no fields at all", () => {
    submitViaForm({ url: "https://3ds.provider.test/cancel" });

    const form = submitted();

    expect(form.getAttribute("action")).toBe(
      "https://3ds.provider.test/cancel"
    );
    expect(submittedFields(form)).toEqual({});
  });

  it("leaves no form behind in the document once the hand-off is away", () => {
    submitViaForm({ fields: { MD: "x" }, url: APPROVAL_URL });

    expect(document.querySelectorAll("form")).toHaveLength(0);
  });

  it("serialises a non-string field value rather than dropping it", () => {
    submitViaForm({
      fields: { amount: 1250, retry: false },
      url: APPROVAL_URL
    });

    expect(submittedFields(submitted())).toEqual({
      amount: "1250",
      retry: "false"
    });
  });
});
