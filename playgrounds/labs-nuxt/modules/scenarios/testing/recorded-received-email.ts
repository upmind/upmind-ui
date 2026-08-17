/**
 * @module scenarios/testing/recorded-received-email
 * @description The ONE received email the read overlay opens, read from the
 * capture run's own recording of `GET emails/:id?with=data` (reached as
 * `recordedBodies["client-email-history"]` on the headless package's ONE
 * `./testing` entry). Nothing here is authored: the id and the message body are
 * the bytes staging returned.
 *
 * `body` is the whole point of the single read — the collection response never
 * carries it, so it is the field that proves the overlay fetched rather than
 * redrew the row it was handed.
 */

import { recordedBodies } from "@upmind-automation/headless/testing";

type WireReceivedEmail = {
  id: string;
  subject: string;
  data?: { body?: string };
};

const one = (await recordedBodies["client-email-history"][
  "get-emails-id"
]()) as { response: { body: { data: WireReceivedEmail } } };

const recorded = one.response.body.data;

/** The recorded email's own id — what a row opens and the read is keyed by. */
export const receivedEmailId = recorded.id;

/** The recorded message body: real sent HTML, never a hand-written sample. */
export const receivedEmailBody = recorded.data?.body ?? "";
