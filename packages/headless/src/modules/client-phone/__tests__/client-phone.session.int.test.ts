// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone editor — sustained single-session use (AC-35)
 *
 * ## Job To Be Done
 * Model the REAL app's lifecycle, not the harness's: ONE session boot, brand
 * settled first, then a client managing several phone numbers back to back —
 * open, edit, save, close, repeat — and prove the editor stays ready within a
 * tight bound (`READY_BOUND_MS`) on every open, not only the first.
 *
 * Sibling seeding is not uniform across this module: `manager` and
 * `mutations` also seed ONCE per file (a `beforeAll` `seedClientSession()`),
 * matching this file's model. `collection` and `guard` deliberately seed
 * per-test / per-describe instead, because those suites assert differing
 * session shapes across their cases; `AC-28`'s case keeps its own isolated
 * seed for the same reason. This file's contribution isn't per-file seeding
 * — it's driving one booted session through a full multi-cycle open/edit/
 * save/close sequence, brand-ready first, exactly as the real app boots.
 *
 * ## What This Found
 * This suite was written to separate a real defect from a test-harness
 * artifact, and it found a real one: a deterministic ~7s stall on the
 * second `.fresh()` draft opened within a session (measured cycle timings
 * `[119, 208, 205, 7072, 204, 204]`, reproduced twice within 30ms of each
 * other). Root cause, per operator ruling 6: `client-phone.services.ts`'s
 * `loadLookups` called `useSystem().isReady()` — an uncapped poll across all
 * system queries — BEFORE `ensureCountries()`, which already awaits brand
 * readiness and the countries query's own settled promise. That redundant
 * gate was removed. The suite now completes all six cycles well inside the
 * bound (~679ms total at Verify).
 *
 * ## What Breaks If This Fails
 * This file is now the regression tripwire for that stall: if
 * `useSystem().isReady()` (or an equivalent uncapped readiness poll) is ever
 * reintroduced ahead of lookup loading, this suite goes red first — before a
 * client hits a stalled editor opening a second, third, or later phone
 * number in one sitting.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { useClientPhoneManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { ClientPhoneContextTypes } from "../client-phone.types";
import { recorded, seedClientSession } from "./client-phone.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

const GB = "GB";

/** Real-interaction budget: a stalled 7s-class regression must fail this. */
const READY_BOUND_MS = 2000;

type Cycle =
  | { kind: "existing"; nationalNumber: string }
  | { kind: "fresh"; nationalNumber: string };

/**
 * Six cycles, alternating an existing number and a fresh draft, mirroring "a
 * consumer manages several numbers in one sitting" rather than a single
 * open. Every national number below is checked against this module's own
 * recorded 10-row list and both recorded pages (see the fixtures under
 * `fixtures/get-clients-id-phones*.json`) to guarantee a genuinely fresh
 * number reaches `ensure`'s POST path rather than colliding with a real row.
 */
const CYCLES: Cycle[] = [
  { kind: "existing", nationalNumber: "7900123001" },
  { kind: "fresh", nationalNumber: "7900123002" },
  { kind: "existing", nationalNumber: "7900123003" },
  { kind: "fresh", nationalNumber: "7900123004" },
  { kind: "existing", nationalNumber: "7900123005" },
  { kind: "fresh", nationalNumber: "7900123006" }
];

// -----------------------------------------------------------------------------

describe("client-phone editor — sustained single-session use", () => {
  let clientId: string;

  // ONE boot for the whole file — the point of this suite. `seedClientSession`
  // already waits for the active session (and, transitively through the
  // manager's own `loadLookups`, the brand-readiness bootstrap) to settle
  // before resolving, so brand is ready before any editor in the sequence
  // below ever opens.
  beforeAll(async () => {
    ({ clientId } = await seedClientSession());
  });

  it(
    "AC-35 stays ready well under the bound across 6 open/edit/save/close " +
      "cycles in one booted session, including a fresh draft",
    async () => {
      expect(clientId).toBeTruthy();
      const target = recorded.one().data;
      const timings: number[] = [];

      for (const cycle of CYCLES) {
        const manager =
          cycle.kind === "existing"
            ? useClientPhoneManager()
                .as(ScopeActorTypes.SELF)
                .for(ClientPhoneContextTypes.PHONE, target.id)
            : useClientPhoneManager().as(ScopeActorTypes.SELF).fresh();

        const openedAt = Date.now();
        await manager.useActions().isReady();
        timings.push(Date.now() - openedAt);

        if (cycle.kind === "existing") {
          expect(manager.useContext().id.value).toBe(target.id);
        } else {
          expect(manager.useMeta().isNew.value).toBe(true);
        }

        manager.useActions().input({
          phone: {
            number: null,
            nationalNumber: cycle.nationalNumber,
            countryCallingCode: "44",
            country: GB
          }
        });
        await manager.useActions().update();

        manager.useActions().destroy();
      }

      // The load-bearing evidence: every open in the sequence, not only the
      // first, stays well under a real interaction budget. A later-opens-get-
      // slower regression fails here rather than only showing up as a mean.
      for (const [index, elapsed] of timings.entries()) {
        expect(
          elapsed,
          `cycle ${index} (${CYCLES[index].kind}) took ${elapsed}ms — ` +
            `timings so far: ${JSON.stringify(timings)}`
        ).toBeLessThan(READY_BOUND_MS);
      }
    }
  );
});
