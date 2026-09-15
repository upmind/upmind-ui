// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview `?init=upgrade` deep link — the trigger and the strip, against a
 * declared placeholder
 *
 * ## Job To Be Done
 * Prove an upgrade deep link takes the product page's own re-target arm and
 * spends its instruction on the way — the same trigger and the same strip
 * legacy performed.
 *
 * ## What these beats do NOT grade
 * Whether the client may upgrade THAT product. `admitsIntent` has no upgrade
 * gate: the real one is legacy's `canUpgradeDowngradeAsClient` and it is a
 * declared STUB until CT-1 (FE-3029) + CT-2 (FE-3206) (parity.yaml, disposition
 * `Renamed`; design §6.1's per-intent table). There is no contracts module and
 * no recorded product in this tree (design §6.3), so the url's product token is
 * an opaque route token — the beats below grade the param hop and the
 * placeholder surface, and nothing about a real product's eligibility.
 *
 * ## What Breaks If These Fail
 * A client who clicked "Upgrade" in an email lands on the product page with
 * nothing offered, or with the instruction still on the url so the surface
 * re-opens over every later thing they do on that page.
 *
 * @anchor init-deep-link.feature
 * @anchor AC7
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QUERY_PARAMS } from "@upmind-automation/types";
import { InitIntent, UPGRADE_OVERLAY_ID } from "../labs.constants";
import { ROUTE } from "../types";
import {
  clearClientSession,
  driveFunnel,
  seedClientSession,
  server
} from "./init-deep-link.harness";
import {
  BEAT_TIMEOUT,
  arriveAt,
  initParamInUrl
} from "./init-deep-link.recordings";
import { endsWith, keys } from "lodash-es";

// -----------------------------------------------------------------------------

/** An opaque route token — see "What these beats do NOT grade" above. */
const PRODUCT_ROUTE_TOKEN = "no-recorded-contract-product";

const upgradeLink = (intent: string = InitIntent.UPGRADE) =>
  arriveAt(ROUTE.CONTRACT_PRODUCT, {
    params: { [QUERY_PARAMS.PRODUCT_ID]: PRODUCT_ROUTE_TOKEN },
    query: { [QUERY_PARAMS.INIT]: intent }
  });

const expectInstructionSpent = (): Promise<void> =>
  vi.waitFor(() => expect(initParamInUrl()).toBeUndefined(), {
    timeout: 2000
  });

// -----------------------------------------------------------------------------

describe("an upgrade deep link on the client's product page", () => {
  beforeEach(async () => {
    await seedClientSession();
  });

  afterEach(async () => {
    server?.resetHandlers();
    await clearClientSession();
  });

  it(
    "carries the url's own product token onto the placeholder upgrade surface, and spends the instruction (@AC7)",
    async () => {
      const target = await driveFunnel(upgradeLink());

      expect(endsWith(String(target.name), `--${UPGRADE_OVERLAY_ID}`)).toBe(
        true
      );
      expect(target.params?.[QUERY_PARAMS.PRODUCT_ID]).toBe(
        PRODUCT_ROUTE_TOKEN
      );
      expect(keys(target.query ?? {})).not.toContain(QUERY_PARAMS.INIT);
      await expectInstructionSpent();
    },
    BEAT_TIMEOUT
  );

  it(
    "opens nothing on the product page when the instruction is one nobody recognises, and still spends it (@AC7)",
    async () => {
      const target = await driveFunnel(upgradeLink("downgrade-everything"));

      expect(target.name).toBe(ROUTE.CONTRACT_PRODUCT);
      await expectInstructionSpent();
    },
    BEAT_TIMEOUT
  );
});
