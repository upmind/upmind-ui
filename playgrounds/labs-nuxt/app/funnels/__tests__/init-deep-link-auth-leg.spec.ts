// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview `?init` deep-link — surviving the sign-in the client never asked
 * for
 *
 * ## Job To Be Done
 * A deep link arrives before the app has decided whether the client is signed
 * in. Prove the instruction survives the auth bounce on a page whose funnel
 * state gates the session: the visitor is asked to sign in over that page, the
 * instruction rides the auth target rather than being spent on the redirect,
 * and acting on it once the session exists opens the surface the email asked
 * for.
 *
 * Both beats run the arriving route through the REAL funnel, so the session
 * gate's own re-target arm, its condition and its assign are what gets graded.
 *
 * ## What Breaks If These Fail
 * A client signed out on a shared machine clicks a link, signs in, and arrives
 * with nothing open. The email's instruction was spent on the redirect, so the
 * one step the link promised silently became two — and the client has to find
 * the affordance themselves.
 *
 * @anchor init-deep-link.feature
 * @anchor AC6
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { QUERY_PARAMS } from "@upmind-automation/types";
import {
  ADD_SESSION_PARAM,
  InitIntent,
  UPGRADE_OVERLAY_ID
} from "../labs.constants";
import { ROUTE } from "../types";
import {
  clearClientSession,
  driveFunnel,
  seedClientSession,
  server
} from "./init-deep-link.harness";
import { BEAT_TIMEOUT, arriveAt } from "./init-deep-link.recordings";
import { endsWith, get, keys, split } from "lodash-es";

// -----------------------------------------------------------------------------

const PRODUCT_ROUTE_TOKEN = "no-recorded-contract-product";

const upgradeLink = () =>
  arriveAt(ROUTE.CONTRACT_PRODUCT, {
    params: { [QUERY_PARAMS.PRODUCT_ID]: PRODUCT_ROUTE_TOKEN },
    query: { [QUERY_PARAMS.INIT]: InitIntent.UPGRADE }
  });

// -----------------------------------------------------------------------------

describe("a deep link followed while signed out", () => {
  beforeEach(async () => {
    await seedClientSession();
    await clearClientSession();
  });

  afterEach(async () => {
    server?.resetHandlers();
    await clearClientSession();
  });

  it(
    "asks the client to sign in over that page, with the instruction still attached (@AC6)",
    async () => {
      const target = await driveFunnel(upgradeLink());

      expect(target.name).toBe(`${ROUTE.CONTRACT_PRODUCT}--session`);
      expect(get(target, ["query", QUERY_PARAMS.INIT])).toBe(
        InitIntent.UPGRADE
      );
      expect(get(target, ["params", QUERY_PARAMS.PRODUCT_ID])).toBe(
        PRODUCT_ROUTE_TOKEN
      );
      expect(keys(target.query ?? {})).not.toContain(ADD_SESSION_PARAM);
    },
    BEAT_TIMEOUT
  );

  it(
    "acts on the instruction once the session exists, opening the surface where the client landed (@AC6)",
    async () => {
      const diverted = await driveFunnel(upgradeLink());
      const parent = split(String(diverted.name), "--")[0] ?? "";

      const returned = arriveAt(parent, {
        params: { [QUERY_PARAMS.PRODUCT_ID]: PRODUCT_ROUTE_TOKEN },
        query: (diverted.query ?? {}) as Record<string, string>
      });

      await seedClientSession();
      const target = await driveFunnel(returned);

      expect(endsWith(String(target.name), `--${UPGRADE_OVERLAY_ID}`)).toBe(
        true
      );
    },
    BEAT_TIMEOUT
  );
});
