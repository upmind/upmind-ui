// -----------------------------------------------------------------------------
/**
 * @module funnels/labs.constants
 * @description The query params `authOverlayTarget` writes, and the words
 * `?init` is answered in, spelt ONCE. The funnel writes the auth params and the
 * surface bag must strip them, and those two live in module graphs that may not
 * import each other — so the names sit here, in a leaf carrying nothing vue- or
 * funnel-shaped.
 */

import { QUERY_PARAMS } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/** The word this tree already spells a session spawned beside the live ones. */
export const ADD_SESSION_PARAM = "fresh";

/**
 * The actor whose session the overlay collects — the `/as/<actor>` segment's own
 * word, carried in the query rather than the path because the overlay is a CHILD
 * of the page: writing it into `scopeSuffix` would re-scope the page underneath,
 * and adding a staff session is not a request to view the page as staff
 * (`R6-3b`).
 */
export const ACTOR_PARAM = "as";

/** The form the auth overlay opens on. */
export const MODE_PARAM = "mode";

/**
 * Every param the auth target writes. The ROUTER owns them, so the surface bag
 * never carries one onto a scope push: a `fresh` riding a scope switch re-opens
 * the ADD-SESSION journey on the next guard rejection, which is the `H5` split
 * the target exists to encode.
 *
 * `QUERY_PARAMS.INIT` is deliberately absent: it is the EMAIL's instruction to
 * the screen, not the router's to the overlay, so it must RIDE a scope push
 * rather than be stripped from one (design §7).
 */
export const AUTH_TARGET_PARAMS: string[] = [
  ACTOR_PARAM,
  ADD_SESSION_PARAM,
  MODE_PARAM,
  QUERY_PARAMS.CANCEL_URL
];

/**
 * The overlay suffix `?init=pay` opens — its OWN key, never `pay`. That one
 * resolves the "resuming payment" interstitial, which does no work by design
 * (`app/pages/overlays/pay.vue`): with no operation in flight nothing would ever
 * settle, so it would park the payer on a spinner.
 */
export const PAYMENT_OVERLAY_ID = "payment";

/** The overlay suffix `?init=upgrade` opens. */
export const UPGRADE_OVERLAY_ID = "upgrade";

/**
 * The two values legacy's `?init` carried — `invoiceProvider.vue:426-433` paid,
 * `cProdProvider.vue:940-947` upgraded. An unrecognised value is refused.
 */
export const InitIntent = {
  PAY: "pay",
  UPGRADE: "upgrade"
} as const;

export type InitIntent = (typeof InitIntent)[keyof typeof InitIntent];

/**
 * Intent → the `LABS_OVERLAYS` suffix it opens. One table, so the guard carries
 * no overlay-id literal and "which surface does this value open" has one answer.
 */
export const INIT_INTENT_OVERLAY: Record<InitIntent, string> = {
  [InitIntent.PAY]: PAYMENT_OVERLAY_ID,
  [InitIntent.UPGRADE]: UPGRADE_OVERLAY_ID
};
