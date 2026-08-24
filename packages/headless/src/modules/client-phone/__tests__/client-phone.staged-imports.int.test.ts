// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — staged imports ride the list read (F8)
 *
 * ## Job To Be Done
 * Legacy hardcodes `with_staged_imports: 1` into every phone list read
 * (`phones.ts:44`). Prove the module's boot request now carries the same
 * param on the wire — URL scoping via `useUrl`, not a criteria branch, so it
 * is asserted here rather than in `client-phone.query-schema.int.test.ts`.
 *
 * ## What this does NOT prove
 * No recorded fixture in this module carries `staged_import: true`, and no
 * recorded request sends `with_staged_imports` at all — the sandbox network
 * classifier blocks a live `?with_staged_imports=1` capture. So this spec
 * proves the module now SENDS the param; it cannot prove what the API
 * returns for it. See `docs/sdd/client-phone/verify.md` "F8" for the full
 * disclosure.
 *
 * ## What Breaks If This Fails
 * Staged imports silently drop out of the client's own phone list — a
 * regression from legacy with no error, no empty state, nothing to notice.
 */

import { describe, expect, it } from "vitest";
import { useClientPhones } from "..";
import {
  observeRequests,
  seedClientSession
} from "../../../__tests__/criteria-int-kit";
import { installPhonesHandler } from "./client-phone.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-phone — staged imports ride the boot request (F8)", () => {
  it("carries with_staged_imports=1 on the wire", async () => {
    const { clientId } = await seedClientSession(server);
    installPhonesHandler(server, clientId);
    const observed = observeRequests(server, "/phones");

    const phones = useClientPhones();
    await phones.useActions().isReady();
    observed.stop();

    const params = new URL(observed.first().url).searchParams;
    expect(params.get("with_staged_imports")).toBe("1");
  });
});
