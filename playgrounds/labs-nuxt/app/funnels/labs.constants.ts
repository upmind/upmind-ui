// -----------------------------------------------------------------------------
/**
 * @module funnels/labs.constants
 * @description The query params `authOverlayTarget` writes, spelt ONCE. The
 * funnel writes them and the surface bag must strip them, and those two live in
 * module graphs that may not import each other — so the names sit here, in a
 * leaf carrying nothing vue- or funnel-shaped.
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
 */
export const AUTH_TARGET_PARAMS: string[] = [
  ACTOR_PARAM,
  ADD_SESSION_PARAM,
  MODE_PARAM,
  QUERY_PARAMS.CANCEL_URL
];
