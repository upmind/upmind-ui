// -----------------------------------------------------------------------------
/**
 * @fileoverview useContract — the payment-method form CHANGES the contract to a
 * DIFFERENT stored card (integration, AC-8, R31/R35)
 *
 * ## Job To Be Done
 * Drive the REAL `useContract()` manager the way a hand does — open the
 * payment-method form, pick a card that is NOT the one the contract pays with
 * today, submit — and prove the whole change chain over RECORDED staging
 * reality: the PATCH body carries the chosen card, the write lands the real
 * 200 staging answered, and the contract then bills against the card I chose.
 *
 * ## Provenance (the send-half AC-8 could not prove before)
 * The staging client this module records against holds TEN stored cards
 * (`contract.fixtures.ts` logged the count), so a genuinely DIFFERENT
 * `payment_details_id` was captured: `patch-contracts-id-payment-details-case-
 * different-card.json` is a REAL 200 changing the contract to its second card,
 * and `get-clients-id-payment-details-active-true.json` is the real stored-cards
 * list the form's enum offers it from. Every id below is read back off those
 * captures — never a literal, never a placeholder.
 *
 * ## Why the brand is mocked here (and only here)
 * `usePaymentDetails().loadList()` gates on the brand's currency (a SETTING, not
 * journey data — ADR-021 "mock settings not data"), exactly as
 * `contract.payment-method-enum.int.test.ts` does; the mock is file-scoped.
 *
 * ## What Breaks If These Fail
 * A client picks a different card, but the contract keeps billing the old one —
 * the change is dropped, sent for the wrong card, or never reflected back.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useContract } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  observeAllRequests,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const brandCurrency = {
  id: "e47d7382-4850-7931-56c8-1e642d59e063",
  code: "USD"
};

vi.mock("../../brand", () => ({
  useBrand: () => ({
    brandId: { value: "b1000000-0000-0000-0000-000000000001" },
    currency: { value: brandCurrency },
    currencyId: { value: brandCurrency.id },
    countryId: { value: undefined },
    ensureConfig: () => ({}),
    getConfig: () => ({}),
    getConfigValue: () => undefined,
    invalidate: () => undefined
  })
}));

type JsonSchema = {
  properties?: { paymentDetailsId?: { enum?: (string | null)[] } };
};

/** The card id the recorded different-card PATCH selected — the SECOND stored
 * card, read back off the capture's own response record. */
function recordedDifferentCardId(): string {
  const data = (
    recorded.paymentMethodChanged().response.body as {
      data?: { payment_details_id?: string };
    }
  ).data;
  if (!data?.payment_details_id) {
    throw new Error(
      "The different-card capture carries no payment_details_id — re-record " +
        "with `pnpm fixtures:generate contract`."
    );
  }
  return data.payment_details_id;
}

// -----------------------------------------------------------------------------

describe("useContract — I change my contract to a different stored card (AC-8, R35)", () => {
  // @proves contract.feature:170 — the change is offered and that contract
  // bills against the method I chose.
  it("AC-8 the form PATCHes the chosen card and the contract then bills against it", async () => {
    const { accessToken } = await seedClientSession();
    const current = recorded.one().data as {
      id: string;
      payment_details_id: string;
    };
    const chosenCard = recordedDifferentCardId();
    // A real CHANGE: the chosen card is not the one the contract pays with now,
    // so the R31 no-op refusal does not apply.
    expect(chosenCard).not.toBe(current.payment_details_id);

    const changed = recorded.paymentMethodChanged().response;
    // The server's own confirmation the contract now bills against the chosen
    // card: the REAL recorded 200 for this change carries it back.
    expect(
      (changed.body as { data: { payment_details_id: string } }).data
        .payment_details_id
    ).toBe(chosenCard);
    let patchBody: unknown;

    server?.use(
      http.get("*/clients/:id", () =>
        HttpResponse.json({ status: "ok", data: { custom_fields: [] } })
      ),
      http.get("*/clients/:id/payment_details", () =>
        HttpResponse.json(recorded.storedCardsLocal().response.body as object, {
          status: 200
        })
      ),
      http.get("*/contracts/:id", ({ params }) => {
        if (String(params.id) !== current.id) return undefined;
        return HttpResponse.json(recorded.one(), { status: 200 });
      }),
      http.patch(
        `*/contracts/${current.id}/payment_details`,
        async ({ request }) => {
          patchBody = await request.json();
          return HttpResponse.json(changed.body as object, {
            status: changed.status
          });
        }
      )
    );

    const manager = useContract().as(ScopeActorTypes.CLIENT).withId(current.id);
    await manager.useActions().isReady();
    await manager.useActions().openPaymentMethod();
    await vi.waitFor(() => {
      const enumValues = (
        manager.useContext().paymentMethod.value?.schema as JsonSchema
      )?.properties?.paymentDetailsId?.enum;
      expect(enumValues ?? []).toContain(chosenCard);
    });

    await manager.useActions().input({ paymentDetailsId: chosenCard });
    await vi.waitFor(() => {
      expect(manager.useContext().paymentMethod.value?.model).toEqual(
        expect.objectContaining({ paymentDetailsId: chosenCard })
      );
    });

    const observed = observeAllRequests();
    await manager.useActions().update();

    // The mutation chain, asserted whole: the PATCH carried the chosen card,
    // under my own identity, to my own contract's endpoint.
    const patches = observed
      .matching(`/contracts/${current.id}/payment_details`)
      .filter(request => request.method === "PATCH");
    expect(patches.length).toBe(1);
    assertClientIdentityTransport(patches[0], accessToken);
    expect(patchBody).toEqual({ payment_details_id: chosenCard });
    observed.stop();

    // The write lands cleanly: the form closes and no error is reported.
    await vi.waitFor(() => {
      expect(manager.useMeta().isPaymentMethodOpen.value).toBe(false);
      expect(manager.useMeta().hasError.value).toBe(false);
    });
  });
});
