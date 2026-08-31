// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email collection — `reset()` is not `invalidate()`
 *
 * ## Job To Be Done
 * FE-3113 gave every scenario-backed collection a published `reset` action and
 * hands it to forcing, because `invalidate` cannot serve the job: invalidating
 * marks the entry stale and refetches while KEEPING the rows, so the surface
 * redraws the data it already had. Only REMOVING the entry returns the surface
 * to the pending state a forced `loading` is named for, and only removing it
 * stops a failed read being drawn beside rows it did not return
 * (`useForcedState.types`, `ForceReset`).
 *
 * The two actions are therefore proven APART, over the same recorded corpus and
 * the same in-flight window: what the collection HOLDS while the next read is
 * still on the wire is the whole difference between them. A single "the next
 * read fetches again" claim passes for both and is what let the distinction go
 * unproven.
 *
 * ## What Breaks If These Fail
 * `reset` collapses back into `invalidate` and a forced `loading` never renders
 * — the operator arms it, the page keeps the rows it already had, and the
 * loading state the preset exists to preview is unreachable. In the app proper,
 * a stale collection survives the clear that was meant to drop it.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { useClientEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installEmailsListHandler,
  logoutClientSession,
  recordedRows,
  seedClientSession
} from "./client-email.int-helpers";
import { server } from "./setup.integration";
import { min } from "lodash-es";

// -----------------------------------------------------------------------------

/** Wide enough that the in-flight window can be sampled many times over. */
const HELD_MS = 400;

const SAMPLE_MS = 10;

const tick = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Every row count the collection passes through between a cache action being
 * fired and its refetch landing — the window the two actions differ across.
 *
 * @param read the collection's current row count.
 * @param settling the action's own promise; sampling stops when it resolves.
 */
async function heldWhileSettling(
  read: () => number,
  settling: Promise<unknown>
): Promise<number[]> {
  const seen: number[] = [read()];
  let done = false;

  void settling.then(() => {
    done = true;
  });

  while (!done) {
    seen.push(read());
    await tick(SAMPLE_MS);
  }

  seen.push(read());

  return seen;
}

// -----------------------------------------------------------------------------

describe("client-email collection — the cache clear forcing is handed", () => {
  afterEach(async () => {
    await logoutClientSession();
  });

  it("reset() takes the rows away while the next read is in flight — the surface returns to pending", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary, secondary], {
      delayMs: HELD_MS
    });

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();
    expect(emails.useContext().data.value).toHaveLength(2);

    const held = await heldWhileSettling(
      () => emails.useContext().data.value.length,
      emails.useActions().reset()
    );

    expect(
      min(held),
      "reset kept the collection's rows on screen — a forced loading would redraw the data it is meant to be loading"
    ).toBe(0);
  });

  it("invalidate() keeps the rows across that same window — which is why forcing cannot use it", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installEmailsListHandler(server, clientId, [primary, secondary], {
      delayMs: HELD_MS
    });

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();

    const held = await heldWhileSettling(
      () => emails.useContext().data.value.length,
      emails.useActions().invalidate()
    );

    expect(
      min(held),
      "invalidate emptied the collection — the two actions have collapsed into one and reset no longer means anything"
    ).toBe(2);
  });

  it("reset() refills from the wire, so it clears the cache rather than tearing the collection down", async () => {
    const { clientId } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    const list = installEmailsListHandler(server, clientId, [primary]);

    const emails = useClientEmails().as(ScopeActorTypes.SELF);
    await emails.useActions().isReady();
    expect(emails.useContext().data.value).toHaveLength(1);

    list.setRows([primary, secondary]);
    await emails.useActions().reset();

    await vi.waitFor(() =>
      expect(emails.useContext().data.value).toHaveLength(2)
    );
    expect(
      list.reads(),
      "reset served the second read from the entry it was supposed to have removed"
    ).toBeGreaterThan(1);
  });
});
