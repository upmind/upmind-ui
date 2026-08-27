// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/force/__tests__/force-arm-barrier.spec
 * @description FE-3113 `AC3` — arming does not report success before its
 * handlers are installed.
 *
 * ## Job To Be Done
 * The page fires arming and reconciles the preset beside it. If the reconcile
 * wins the race the worker registers with an empty handler list, the page says
 * armed, and every request goes straight past it to STAGING. `armCorpusModule`
 * is the barrier: when it reports true, the module it names must already be the
 * one a handler list is built from.
 *
 * The list is read through the SHARED pointer — `createForceHandlers` with no
 * corpus argument, exactly as the worker builds it — so a corpus that loaded
 * without being installed still fails this.
 *
 * ## What Breaks If These Fail
 * A forced page reaches the live API under a chip that says it is replaying: an
 * armed `empty` writes nothing but reads staging, and an armed track scrubs a
 * writing scene against the real account.
 */

import { describe, expect, it } from "vitest";
import { recordedBodies } from "@upmind-automation/headless/fixtures";
import { armCorpusModule, runtimeCorpus } from "../corpus";
import { createForceHandlers } from "../handlers";
import { isEmpty, keys, map, size } from "lodash-es";

// -----------------------------------------------------------------------------

const RESOLVED: string[] = [];

for (const module of keys(recordedBodies)) {
  const armed = await armCorpusModule(module);
  if (armed) RESOLVED.push(module);
}

// -----------------------------------------------------------------------------

describe("AC3 armed means installed, for every module force can reach", () => {
  it("armed more than one module — a single-module pass would prove nothing", () => {
    expect(RESOLVED.length).toBeGreaterThan(1);
  });

  it.each(RESOLVED)(
    "%s has a handler list off the shared pointer the moment arming reports true",
    async module => {
      expect(await armCorpusModule(module)).toBe(true);

      const installed = runtimeCorpus();

      expect(
        installed,
        `${module} reported armed with no corpus installed`
      ).toBeDefined();
      expect(
        isEmpty(installed),
        `${module} reported armed against an empty corpus`
      ).toBe(false);
      expect(
        size(createForceHandlers("replay")),
        `${module} reported armed while the worker would register zero handlers`
      ).toBeGreaterThan(0);
    }
  );

  it("installs the module it was ASKED for, not whichever load finished last", async () => {
    for (const module of RESOLVED) {
      await armCorpusModule(module);

      expect(
        map(runtimeCorpus(), "request.path").sort(),
        `${module} armed, and the shared pointer holds another module's recordings`
      ).toEqual(map(runtimeCorpus(module), "request.path").sort());
    }
  });

  it("refuses to report armed for a module nothing published (ESC6 · S12)", async () => {
    expect(await armCorpusModule("no-such-module")).toBe(false);
  });
});
