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
 * The observation is taken in the SAME turn the arm resolves in, over a module
 * force has not loaded before. A report that outran its load still arrives at a
 * full corpus a few ticks later, so a spec that arms a module twice — or reads
 * the pointer after any further await — grades a warm cache and can never see
 * the race it exists to catch.
 *
 * The list is read through the SHARED pointer — `createForceHandlers` with no
 * corpus argument, exactly as the worker builds it — so a corpus that loaded
 * without being installed still fails this.
 *
 * ## What Breaks If These Fail
 * A forced page reaches the live API under a chip that says it is replaying: an
 * armed `empty` writes nothing but reads staging, and an armed track scrubs a
 * writing scene against the real account.
 *
 * Negative controls:
 * `force-arm-barrier.reports-before-installed.must-fail.patch`.
 *
 * @anchor force-state.feature
 * @anchor AC3
 */

import { describe, expect, it } from "vitest";
import { recordedBodies } from "@upmind-automation/headless/fixtures";
import { armCorpusModule, runtimeCorpus } from "../corpus";
import { createForceHandlers } from "../handlers";
import { filter, find, isEmpty, keys, map, size } from "lodash-es";

// -----------------------------------------------------------------------------

type Observed = {
  module: string;
  armed: boolean;
  installed: boolean;
  handlers: number;
  shared: string[];
  asked: string[];
};

// An arm that reported true over nothing makes the worker's own call throw
// rather than return a list — the same nothing-is-installed finding, counted as
// the zero handlers it would have registered.
const handlerCount = () => {
  try {
    return size(createForceHandlers("replay"));
  } catch {
    return 0;
  }
};

const OBSERVED: Observed[] = [];

for (const module of keys(recordedBodies)) {
  const armed = await armCorpusModule(module);
  const shared = runtimeCorpus();

  OBSERVED.push({
    module,
    armed,
    installed: !isEmpty(shared),
    handlers: handlerCount(),
    shared: map(shared, "request.path").sort(),
    asked: map(runtimeCorpus(module), "request.path").sort()
  });
}

const ARMED = filter(OBSERVED, "armed");

// -----------------------------------------------------------------------------

describe("AC3 armed means installed, for every module force can reach", () => {
  it("armed more than one module — a single-module pass would prove nothing", () => {
    expect(size(ARMED)).toBeGreaterThan(1);
  });

  it.each(map(ARMED, "module"))(
    "%s held its corpus in the turn arming reported true",
    module => {
      const observed = find(ARMED, { module });

      expect(
        observed?.installed,
        `${module} reported armed with no corpus installed`
      ).toBe(true);
      expect(
        observed?.handlers,
        `${module} reported armed while the worker would register zero handlers`
      ).toBeGreaterThan(0);
    }
  );

  it("installs the module it was ASKED for, not whichever load finished last", () => {
    for (const observed of ARMED) {
      expect(
        observed.shared,
        `${observed.module} armed, and the shared pointer holds another module's recordings`
      ).toEqual(observed.asked);
    }
  });

  it("refuses to report armed for a module nothing published (ESC6 · S12)", async () => {
    expect(await armCorpusModule("no-such-module")).toBe(false);
  });
});
