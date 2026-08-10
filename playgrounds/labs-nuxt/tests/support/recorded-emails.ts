/**
 * @module tests/support/recorded-emails
 * @description The client-emails canary's rows and its 409, read from the
 * capture run's own recordings under
 * `packages/headless/src/modules/client-email/__tests__/fixtures` (reached by
 * the test-lane `@upmind-automation/headless-test-kit` alias). Nothing here is
 * authored: the addresses, the flags and the rejection sentence are the bytes
 * staging returned on 2026-08-05.
 *
 * Only the PROJECTION is written here — wire record to the `Email` row shape
 * `client-email.types.ts` publishes — because the mapper that performs it is
 * `@internal` to headless and unreachable from this package's test lane.
 */

import one from "@upmind-automation/headless-test-kit/fixtures/get-clients-id-emails-id.json";
import list from "@upmind-automation/headless-test-kit/fixtures/get-clients-id-emails.json";
import rejected from "@upmind-automation/headless-test-kit/fixtures/put-clients-id-emails-id-case-set-default-unverified.json";

type WireEmail = {
  id: string;
  email: string;
  default: boolean;
  verified: boolean;
  bounced: boolean;
  can_delete: boolean;
};

const toRow = (wire: WireEmail) => ({
  id: wire.id,
  title: wire.email,
  meta: {
    isDefault: wire.default,
    canDelete: wire.can_delete,
    isVerified: wire.verified,
    isBounced: wire.bounced
  }
});

/** The account's own address: default, verified, and the API forbids deleting it. */
export const defaultRow = toRow(
  (list.response.body.data as WireEmail[])[0] as WireEmail
);

/** The address the capture run created: non-default, unverified, deletable. */
export const unverifiedRow = toRow(one.response.body.data as WireEmail);

/**
 * The same recorded record after the recipient follows the verification link —
 * the one state transition `send_verify` produces, applied to the recording
 * rather than a second invented row.
 */
export const verifiedRow = {
  ...unverifiedRow,
  meta: { ...unverifiedRow.meta, isVerified: true }
};

/** The verbatim sentence the API answers a set-default on an unverified address with. */
export const API_MESSAGE = rejected.response.body.error.message;

/**
 * The rejection a caller sees, carrying `DetailedError`'s own field set off the
 * recorded envelope. The class itself is not constructed here: its constructor
 * reports to Sentry, which a component lane must not reach.
 */
export function recordedRejection(): Error {
  const { code, message, data } = rejected.response.body.error;
  return Object.assign(new Error(message), { code, data, origin: "upmind" });
}
