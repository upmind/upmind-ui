// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.destination-save — the account's real PayPal
 * destination is detected and preselected, the save succeeds, and a refused
 * save keeps the edit (@AC22, @AC23)
 *
 * ## Job To Be Done
 * Protect three behaviours this unit's real captures prove: the manager seeds
 * `model` from the account's OWN saved destination and email (design.md §8.6
 * "it seeds from the account"); a real `update` sends the typed destination and
 * then re-reads the account, and the editor takes its model from that re-read
 * (design.md §8.4 Editors: invalidate, await, `REFRESH`); and a refused
 * `update` fills `errors`, keeps the unsaved edit, and sends no follow-up
 * account/destinations/emails read (design.md §8.2 Failure surface).
 *
 * ## Save case (review W1, W2)
 * The edits go through the consumer `input()` path, never a direct model write.
 * A request observer records the PUT and the account GET that follows it, and a
 * response observer keeps the body that GET is answered with. The test pins
 * `model` to the ids in THAT body and asserts `isDirty`: true after the typing,
 * false once the re-read has re-seeded both `model` and `baseModel` (bdd.md AC23).
 * The replay answers with the recorded account capture, whose ids differ from
 * the typed ones, so a save with no re-seed leaves the typed ids, leaves
 * `isDirty` true and sends no account GET. Control:
 * `affiliate.destination-save.no-reseed`.
 *
 * ## Open seed case
 * An untouched open over an account that already holds its PayPal email
 * triggers no preselect, so `isDirty` is false. A preselect open stays dirty by
 * design (AC23), and no recording holds a PayPal destination with no email, so
 * that open is a named gap here.
 *
 * ## Named gap
 * No account read after a non-PayPal save is recorded (the generator reverts
 * the save), so the re-read body cannot carry the saved id. This spec proves
 * that the editor re-reads and follows the re-read. It does not prove that the
 * saved value persists.
 *
 * ## What Breaks If These Fail
 * A client's real PayPal destination and email would fail to show as
 * pre-selected, a save would leave the editor showing the typed values instead
 * of the account the server now holds, or a refused save would silently discard
 * the client's in-progress edit and re-seed the form from the (unsaved) server
 * state.
 *
 * ## Operator brief, 2026-09-30 — staging state changed, retitled
 * The account's real payout destination is now PayPal with the default
 * email `nathan.robinson+checkouttest@upmind.com` (recorded fresh this pass
 * — `affiliate.fixtures.ts`). The prior "stays empty for the real,
 * non-PayPal default destination" title/assertion (NO-PAYPAL-DESTINATION) no
 * longer describes reality — corrected, not carried forward stale. The
 * account SAVE (`PUT /api/accounts/{a}`) is also now recorded (base
 * capture, `put-accounts-id.json`) — an idempotent save of the SAME PayPal
 * destination + email pair the account already carries, so the account
 * ends this spec exactly where it started (no restore call owed).
 *
 * Stated omissions (ADR-021, design.md §8.2): the refused-save case below is
 * a declared control response (`serveFailure`, 422), not a recorded capture
 * — code-tests.companion.md: "Control and error responses are exempt" from
 * the recorded-only law. The 5xx case takes the same error-state path per
 * design.md §8.2 note 3, unexercised here to avoid re-proving the identical
 * branch.
 */
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliatePayoutDestinationManager } from "../useAffiliatePayoutDestinationManager";
import {
  inputAndSettle,
  seedRealClient,
  serveCapture,
  serveFailure,
  withBound
} from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

const SAVE_ROUTE = "*/api/accounts/:accountId";

type RawAffiliateAccountBody = {
  data?: {
    account?: {
      affiliate_payout_destination_id?: string;
      affiliate_payout_paypal_email_id?: string;
    };
  };
};

type SavePutBody = {
  affiliate_payout_destination_id?: string;
  affiliate_payout_paypal_email_id?: string | null;
};

type SavePutResponseBody = {
  data?: {
    affiliate_payout_destination_id?: string;
    affiliate_payout_paypal_email_id?: string | null;
  };
};

/**
 * The real non-PayPal save recorded fresh by `affiliate.fixtures.ts`
 * (`case=non-paypal-save`) — pseudo-Nathan review pass-7, blocker 1. A PUT
 * of a different destination must answer the recording of THAT exact save,
 * never the PayPal-pair capture that a body-blind replay match would fall
 * back to.
 */
function recordedNonPaypalSave(): {
  destinationId: string;
  emailId: null;
} {
  const account = recorded<SavePutResponseBody>(
    "put-accounts-id-case-non-paypal-save"
  ).data;
  const destinationId = account?.affiliate_payout_destination_id;
  if (!destinationId) {
    throw new Error(
      "[affiliate.destination-save] the recorded non-PayPal save capture carries no destination id."
    );
  }
  return { destinationId, emailId: null };
}

/** Read from the recorded account capture — never a hand-copied literal. */
function recordedPaypalIds(): { destinationId: string; emailId: string } {
  const account = recorded<RawAffiliateAccountBody>(
    "get-accounts-id-affiliate-with-staged-imports-1"
  ).data?.account;
  const destinationId = account?.affiliate_payout_destination_id;
  const emailId = account?.affiliate_payout_paypal_email_id;
  if (!destinationId || !emailId) {
    throw new Error(
      "[affiliate.destination-save] the recorded account capture carries no PayPal destination/email id."
    );
  }
  return { destinationId, emailId };
}

/**
 * Open the editor over the `client` account, type the recorded non-PayPal
 * destination through the consumer `input()` path, save it, and hand back what
 * the request observers saw. The caller destroys the manager.
 */
async function saveNonPaypalDestination() {
  await seedRealClient();
  const { destinationId } = recordedPaypalIds();
  const typed = recordedNonPaypalSave();

  const seenPuts: { url: string; body: unknown }[] = [];
  server?.events.on("request:start", async ({ request }) => {
    const url = new URL(request.url);
    if (request.method === "PUT" && /\/accounts\/[^/]+$/.test(url.pathname)) {
      seenPuts.push({
        url: url.pathname,
        body: await request.clone().json()
      });
    }
  });

  const reReadRequests: string[] = [];
  server?.events.on("request:start", ({ request }) => {
    const url = new URL(request.url);
    if (
      request.method === "GET" &&
      /\/affiliate$/.test(url.pathname) &&
      seenPuts.length > 0
    ) {
      reReadRequests.push(url.pathname);
    }
  });

  const reReadBodies: RawAffiliateAccountBody[] = [];
  server?.events.on("response:mocked", async ({ request, response }) => {
    const url = new URL(request.url);
    if (
      request.method === "GET" &&
      /\/affiliate$/.test(url.pathname) &&
      seenPuts.length > 0
    ) {
      reReadBodies.push(await response.clone().json());
    }
  });

  const manager = useAffiliatePayoutDestinationManager()
    .as(ScopeActorTypes.CLIENT)
    .fresh();
  await manager.useActions().isReady();

  const destinations = manager.useContext().destinations.value ?? [];
  const nonPaypal = destinations.find(
    destination => destination.id !== destinationId
  );
  if (!nonPaypal || nonPaypal.id !== typed.destinationId) {
    manager.useActions().destroy();
    throw new Error(
      "[affiliate.destination-save] the recorded destinations capture's non-PayPal entry does " +
        "not match the recorded non-paypal-save capture's own destination id — re-record both " +
        "from the same generator run."
    );
  }
  await inputAndSettle(manager, {
    payoutDestinationId: nonPaypal.id,
    paypalEmailId: typed.emailId
  });

  serveCapture<SavePutResponseBody, SavePutBody>(
    "put",
    SAVE_ROUTE,
    "put-accounts-id-case-non-paypal-save",
    {
      bodyMatch: body =>
        body.affiliate_payout_destination_id === typed.destinationId &&
        (body.affiliate_payout_paypal_email_id ?? null) === typed.emailId
    }
  );

  const dirtyBeforeSave = manager.useMeta().isDirty.value;

  await withBound(
    manager.useActions().update(),
    3000,
    "[affiliate.destination-save] update()"
  );

  return {
    manager,
    typed,
    dirtyBeforeSave,
    seenPuts,
    reReadRequests,
    reReadBodies
  };
}

describe("affiliate.destination-save — the account's real PayPal destination is detected, the save succeeds, and a refused save keeps the edit", () => {
  it("the manager seeds the model with the account's real PayPal destination and email", async () => {
    await seedRealClient();
    const { destinationId, emailId } = recordedPaypalIds();

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      expect(manager.useMeta().isPaypal.value).toBe(true);
      expect(manager.useContext().model.value?.payoutDestinationId).toBe(
        destinationId
      );
      expect(manager.useContext().model.value?.paypalEmailId).toBe(emailId);
      expect(manager.useMeta().isDirty.value).toBe(false);
    } finally {
      manager.useActions().destroy();
    }
  });

  it("A client saves a different payout destination, and the editor takes its model from the account read that follows the save", async () => {
    const saved = await saveNonPaypalDestination();
    try {
      expect(saved.seenPuts).toHaveLength(1);
      expect(saved.seenPuts[0].body).toEqual({
        affiliate_payout_destination_id: saved.typed.destinationId,
        affiliate_payout_paypal_email_id: saved.typed.emailId
      });
      expect(saved.manager.useMeta().hasError.value).toBe(false);

      await expect.poll(() => saved.reReadRequests.length).toBeGreaterThan(0);
      await expect.poll(() => saved.reReadBodies.length).toBeGreaterThan(0);
      const reRead =
        saved.reReadBodies[saved.reReadBodies.length - 1].data?.account;
      expect(reRead?.affiliate_payout_destination_id).not.toBe(
        saved.typed.destinationId
      );
      await expect
        .poll(() => saved.manager.useContext().model.value?.payoutDestinationId)
        .toBe(reRead?.affiliate_payout_destination_id);
      expect(saved.manager.useContext().model.value?.paypalEmailId).toBe(
        reRead?.affiliate_payout_paypal_email_id
      );
    } finally {
      saved.manager.useActions().destroy();
    }
  });

  it("A client who has saved their payout destination is no longer counted as having unsaved changes", async () => {
    const saved = await saveNonPaypalDestination();
    try {
      expect(saved.dirtyBeforeSave).toBe(true);
      await expect
        .poll(() => saved.manager.useMeta().isDirty.value)
        .toBe(false);
      expect(saved.reReadRequests.length).toBeGreaterThan(0);
    } finally {
      saved.manager.useActions().destroy();
    }
  });

  it("a refused save fills errors, keeps the unsaved edit, and sends no follow-up account/destinations/emails read", async () => {
    await seedRealClient();

    // The manager's re-seed reads `.../affiliate` (the account),
    // `.../affiliate_payout_destination` and `.../emails` (design.md §8.6
    // "the re-seed reads the saved ids"; §8.1's read table) — never a bare
    // `GET /accounts/{a}` with no `/affiliate` suffix. Observed BEFORE the
    // manager is even built, so the initial `loading` load itself proves the
    // filter is live.
    const seenReseedGets: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      const path = new URL(request.url).pathname;
      if (
        request.method === "GET" &&
        (path.endsWith("/affiliate") ||
          path.includes("/affiliate_payout_destination") ||
          path.endsWith("/emails"))
      ) {
        seenReseedGets.push(path);
      }
    });

    const manager = useAffiliatePayoutDestinationManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    try {
      await manager.useActions().isReady();

      // The filter is live: the initial `loading` load already sent all
      // three re-seed reads. A no-op filter (one that matched nothing) would
      // pass the assertion below for the wrong reason — this line is what
      // stops that.
      expect(seenReseedGets.length).toBeGreaterThan(0);
      seenReseedGets.length = 0;

      serveFailure("put", SAVE_ROUTE, 422);

      const { destinationId } = recordedPaypalIds();
      const destinations = manager.useContext().destinations.value ?? [];
      const nonPaypal = destinations.find(
        destination => destination.id !== destinationId
      );
      if (!nonPaypal) {
        throw new Error(
          "[affiliate.destination-save] the recorded destinations capture carries only one entry — cannot exercise a real edit."
        );
      }
      await inputAndSettle(manager, { payoutDestinationId: nonPaypal.id });

      await withBound(
        manager.useActions().update(),
        3000,
        "[affiliate.destination-save] update()"
      );

      expect(manager.useMeta().hasError.value).toBe(true);
      expect(manager.useContext().model.value?.payoutDestinationId).toBe(
        nonPaypal.id
      );
      expect(seenReseedGets).toEqual([]);
    } finally {
      manager.useActions().destroy();
    }
  });
});
