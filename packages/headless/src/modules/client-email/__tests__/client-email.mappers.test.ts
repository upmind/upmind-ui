// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email mappers — the wire ⇄ view-model boundary (unit)
 *
 * ## Job To Be Done
 * Prove AC-2: a wire email arrives as an `Email` carrying its display fields
 * (`title`, `description`, `type`) and its status flags (`meta.isDefault` /
 * `.isVerified` / `.isBounced` / `.canDelete` + `bouncedAt`), and that
 * `EmailTypes` resolves the API's `type` key `1` to `"Account"`.
 *
 * Two inputs are used, deliberately:
 *   1. the RECORDED wire row from `fixtures/get-clients-id-emails.json` — the
 *      shape staging actually returns today;
 *   2. the literal wire item AC-2 names (`default:true, verified:false,
 *      bounced:true, can_delete:false, bounced_at:<ts>`). The staging client
 *      holds no bounced address, so that combination is unrecordable; it is
 *      the CONTRACT's stated input to a pure function, not a stand-in for a
 *      recording, and it is built by overriding the recorded row rather than
 *      hand-writing a wire body.
 *
 * ## What Breaks If These Fail
 * A UI reads an email's default / verified / bounced / deletable state
 * backwards, or loses the description and account-email type the oracle's row
 * renders (parity.yaml R2).
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { EmailTypes } from "..";
import { mapEmail, mapEmails, mapIEmail } from "../client-email.mappers";
import type { IEmail } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type WireList = { data: Array<Record<string, unknown>> };

/** The account's own recorded email row. */
function recordedRow(): Record<string, unknown> {
  return getFixtureBody<WireList>("get-clients-id-emails", { recordingsDir })
    .data[0];
}

/** The recorded row with AC-2's literal status combination applied. */
function acTwoRow(): Record<string, unknown> {
  return {
    ...recordedRow(),
    default: true,
    verified: false,
    bounced: true,
    bounced_at: "2026-06-15T09:00:00.000Z",
    can_delete: false,
    type: 1
  };
}

// -----------------------------------------------------------------------------

describe("mapEmail — AC-2 display and status fields", () => {
  it("AC-2 maps the documented default/unverified/bounced/non-deletable combo onto Email.meta with bouncedAt", () => {
    const wire = acTwoRow();

    const mapped = mapEmail(wire as unknown as IEmail);

    expect(mapped.meta).toEqual({
      isDefault: true,
      isVerified: false,
      isBounced: true,
      canDelete: false
    });
    expect(mapped.bouncedAt?.date).toBeTruthy();
    expect(mapped.bouncedAt?.relative).toBeTruthy();
  });

  it("AC-2 carries the display fields — title is the address, description is present, type is the API's key", () => {
    const wire = recordedRow();

    const mapped = mapEmail(wire as unknown as IEmail);

    expect(mapped.title).toBe(wire.email);
    expect(mapped.email).toBe(wire.email);
    expect(mapped.id).toBe(wire.id);
    expect(mapped.description).toBe("");
    expect(mapped.type).toBe(wire.type);
  });

  it("AC-2 resolves the API's type key 1 to the Account category", () => {
    const wire = recordedRow();

    const mapped = mapEmail(wire as unknown as IEmail);

    expect(EmailTypes.find(entry => entry.key === mapped.type)?.value).toBe(
      "Account"
    );
  });

  it("AC-2 maps the recorded verified, non-bounced, non-deletable default row", () => {
    const wire = recordedRow();

    const mapped = mapEmail(wire as unknown as IEmail);

    expect(mapped.meta).toEqual({
      isDefault: wire.default,
      isVerified: wire.verified,
      isBounced: wire.bounced,
      canDelete: wire.can_delete
    });
  });

  it("AC-2 reports no bounce for an address that never bounced", () => {
    const wire = { ...recordedRow(), bounced: false, bounced_at: null };

    const mapped = mapEmail(wire as unknown as IEmail);

    expect(mapped.meta.isBounced).toBe(false);
  });
});

describe("mapEmails — AC-2 across the collection", () => {
  it("AC-2 maps every recorded row, preserving order", () => {
    const wire = [recordedRow(), { ...recordedRow(), id: "second-row" }];

    const mapped = mapEmails(wire as unknown as IEmail[]);

    expect(mapped).toHaveLength(2);
    expect(mapped.map(email => email.id)).toEqual([
      recordedRow().id,
      "second-row"
    ]);
  });

  it("AC-2 maps an empty collection to an empty array", () => {
    expect(mapEmails([])).toEqual([]);
  });
});

describe("mapIEmail — the outbound add body", () => {
  it("AC-15 emits {email} only — the server fixes type to Account (parity.yaml R25)", () => {
    const created = getFixtureBody<{ data: { email: string; type: number } }>(
      "post-clients-id-emails",
      { recordingsDir }
    ).data;

    const body = mapIEmail({ email: created.email });

    expect(body).toEqual({ email: created.email });
    expect(body).not.toHaveProperty("type");
    // R25's read-back: the recorded creation came back typed Account (1)
    // despite the request body omitting `type`.
    expect(created.type).toBe(1);
  });
});
