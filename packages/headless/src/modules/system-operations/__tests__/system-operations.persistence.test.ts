// -----------------------------------------------------------------------------
/**
 * @fileoverview systemOperations persistence — an operation survives a same-tab
 * refresh
 *
 * ## Job To Be Done
 * Prove operations round-trip through sessionStorage so a user returning from
 * off-site auth keeps their operation across a page reload: the operation is
 * written under the upmind:operations key, and rebuilding the module from that
 * storage (what a refresh does) still resolves it by oid. Assertions come from
 * FE-3030 requirements.md AC-6 and design.md §Persistence — never from the
 * implementation source.
 *
 * ## What Breaks If These Fail
 * A refresh mid-return wipes the pending operation, so the payment completion
 * the user was mid-way through is lost and cannot resume.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useOperations } from "..";

// -----------------------------------------------------------------------------

const STORAGE_KEY = "upmind:operations";

beforeEach(() => {
  sessionStorage.clear();
  vi.resetModules();
});

describe("systemOperations — refresh survival", () => {
  it("AC-6 · persists to sessionStorage and resolves after the module is rebuilt from it", async () => {
    const oid = useOperations().createOperation("ac6-refresh", { a: 1 });

    const raw = sessionStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)[oid]).toMatchObject({
      key: "ac6-refresh",
      payload: { a: 1 }
    });

    vi.resetModules();
    const fresh = await import("../useOperations");

    expect(fresh.useOperations().getOperation(oid)).toMatchObject({
      key: "ac6-refresh",
      payload: { a: 1 }
    });
  });
});
