/**
 * @fileoverview brand — the store visibility rule (`showStore`)
 *
 * ## Job To Be Done
 * Prove the rule behind `useBrand().showStore` for every display mode the
 * brand's `SHOW_CLIENT_STORE` setting can hold and every session kind that
 * reads it: an anonymous guest, a signed-in client (a guest customer
 * included) and a staff session (design 8.6 table).
 *
 * ## What Breaks If These Fail
 * The client area offers the place-new-order control on a brand that hides
 * its store, or hides it from a signed-in client on a show-to-signed-in brand.
 */

import { describe, expect, it } from "vitest";
import { StoreDisplayMode } from "@upmind-automation/types";
import { resolveShowStore } from "../brand.mappers";

/** Whether each session kind is authenticated (design 8.6, receipt q21). */
const SESSIONS = { anonymousGuest: false, client: true, staff: true } as const;

const showsFor = (mode: StoreDisplayMode | undefined) =>
  ({
    anonymousGuest: resolveShowStore(mode, SESSIONS.anonymousGuest),
    client: resolveShowStore(mode, SESSIONS.client),
    staff: resolveShowStore(mode, SESSIONS.staff)
  }) as const;

// FE-3237 AC5
describe("AC-9: store visibility", () => {
  it("an unset mode shows the store to every session kind", () => {
    expect(showsFor(undefined)).toEqual({
      anonymousGuest: true,
      client: true,
      staff: true
    });
  });

  it("SHOW shows the store to every session kind", () => {
    expect(showsFor(StoreDisplayMode.SHOW)).toEqual({
      anonymousGuest: true,
      client: true,
      staff: true
    });
  });

  it("HIDE hides the store for every session kind", () => {
    expect(showsFor(StoreDisplayMode.HIDE)).toEqual({
      anonymousGuest: false,
      client: false,
      staff: false
    });
  });

  it("SHOW_LOGGED_IN shows the store to a signed-in client or staff, never to an anonymous guest", () => {
    expect(showsFor(StoreDisplayMode.SHOW_LOGGED_IN)).toEqual({
      anonymousGuest: false,
      client: true,
      staff: true
    });
  });
});
