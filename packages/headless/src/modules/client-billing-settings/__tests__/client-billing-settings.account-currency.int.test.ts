// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings account-currency slice — the second
 * oracle form, folded in 2026-09-09 (AC-20 through AC-26)
 *
 * ## Job To Be Done
 * Drive the REAL `useBillingSettings()` / `useBillingSettingsManager()`
 * THROUGH THE BARREL against MSW-replayed staging recordings and prove: a
 * client reads their own account's billing currency and preferred payment
 * currency off the session's already-loaded account list, at ZERO extra
 * requests and without touching the shared client-record key (AC-20, row
 * X4); a client can set and clear their preferred payment currency and
 * change their billing currency on `PUT accounts/{accountId}` — never
 * `clients/{id}` — carrying only the changed keys (AC-21, AC-22); the
 * preferred-currency choice is offered ONLY on an explicit truthy brand
 * opt-in, structurally disjoint from the consolidation surface's own
 * default-hidden gate (AC-23); the currency options are the brand's own,
 * ordered by name (AC-24 — the omit-and-append edge, where the account's own
 * currency is appended when the brand list lacks it, is proven in isolation by
 * the sibling `currency-options-own-missing.int.test.ts`, which the colocated
 * must-fail patch mutates); the whole slice is withheld — never silently
 * mis-served — when
 * the addressed client is not the session's own (AC-25, the FE-2824 shape);
 * and a successful write is what the next read, and the shared session data
 * the app-wide currency-precedence consumer reads, both reflect (AC-26).
 *
 * Every outbound-request assertion is on the REQUEST (URL + auth identity
 * transport, A7), never the response echo.
 *
 * ## Ordering note (mirrors availability.int.test.ts's own documented reason)
 * The AC-24 describe block runs FIRST, deliberately: `useBrand().currencies`
 * is fed by a module-WIDE singleton query that never re-issues a request
 * once any earlier test in THIS FILE has already resolved it (the same
 * shared-readiness shape `design.md` §15.5 names). Registering the real
 * `brand/settings` handler only after a later block has already resolved
 * the singleton against the harness's throwaway `{ languages: [] }` stub
 * would silently poison every later AC-24 case.
 *
 * ## Known gap (declared, not silently dropped)
 * AC-26's read-back also asks that `basket-currency`'s `accountCurrency()`
 * be exercised "through its own public surface". That surface —
 * `useBasketCurrency()` — requires a full `useBasket()` boot (a spawned
 * currency child actor keyed off a real basket), which is disproportionate
 * scope for this module's OWN targeted spec and has no existing basket-
 * currency integration-test precedent in this tree to mirror. `accountCurrency()`
 * itself is a MODULE-PRIVATE, unexported function — it is not part of any
 * public surface this module could call even if it tried. What IS proven
 * here is the substantive claim design.md §15.8 makes: the SHARED session
 * data `accountCurrency()` itself reads (`activeUser.accounts[0].
 * preferredPaymentCurrencyId`) is the value this write just saved — via
 * `session-store`'s own public `useActiveSession()` context, never by
 * reimplementing the precedence logic in this spec.
 *
 * ## What Breaks If These Fail
 * A client who can never actually pay in their preferred currency because
 * the write silently targets the wrong endpoint or entity; a payment-
 * currency control shown to every brand regardless of opt-in (the FE-2824
 * shape, again); or a save that reports success while the rest of the app —
 * and the client's own next read — keep resolving the stale currency.
 */

import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { useBillingSettings, useBillingSettingsManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useActiveSession } from "../../session-store";
import {
  assertAccountIdentityTransport,
  installAccountPutEchoHandler,
  installBrandGatesHandler,
  installBrandSettingsHandler,
  installSettingsGetHandler,
  observeAccountRequests,
  recorded,
  resetClientBillingSettingsScopes,
  sessionStoreRecordingsDir,
  seedClientSession,
  seedClientSessionWithPreferredCurrencySet
} from "./client-billing-settings.int-helpers";
import { server } from "./setup.integration";
import type {
  Account,
  BrandGatesEnvelope,
  Envelope
} from "./client-billing-settings.int-helpers";
import type { IClient } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const B6_KEY = "billing.payment_currencies.enable_different_currency_payment";

/** A constructed id, deliberately distinct from the session's real client id (mirrors read.int.test.ts). */
const OTHER_CLIENT_ID = "22223333-4444-5555-6666-777788889999";

/** The session's own REAL, committed (masked) account — never a hardcoded value. */
function sessionAccount(): Account {
  const selfBody = getFixtureBody<{ data: { accounts: Account[] } }>(
    "get-self",
    { recordingsDir: sessionStoreRecordingsDir }
  );
  return selfBody.data.accounts[0];
}

/** The two-key brand-gates envelope, real, with ONLY the named key(s) overridden — never a fabricated body. */
function brandGatesWith(
  override: (data: BrandGatesEnvelope["data"]) => BrandGatesEnvelope["data"]
): BrandGatesEnvelope {
  const fixture = recorded.brandGates().response.body as BrandGatesEnvelope;
  return { ...fixture, data: override({ ...fixture.data }) };
}

afterEach(() => {
  resetClientBillingSettingsScopes();
});

// -----------------------------------------------------------------------------

describe("useBillingSettings — the currency options (AC-24)", () => {
  it("AC24 offers the brand's supported currencies, ordered by name", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandSettingsHandler(server);

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await settings.useActions().isReady();

    // The recorded brand list already carries the account's own currency, so
    // the append is a no-op here — this case proves the "ordered by name"
    // clause; the omit-and-append edge (row B3) is proven in isolation by
    // client-billing-settings.currency-options-own-missing.int.test.ts. The
    // ternary stays defensive against a re-record dropping the own currency.
    const account = sessionAccount();
    const currencies = recorded.brandSettings().data.currencies;
    const withOwnAppended = currencies.some(c => c.id === account.currency_id)
      ? currencies
      : [...currencies, account.currency];
    const expectedOrder = [...withOwnAppended]
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map(currency => currency.id);
    await vi.waitFor(() =>
      expect(
        settings.useContext().currencyOptions.value.map(c => c.id)
      ).toEqual(expectedOrder)
    );

    settings.useActions().destroy();
  });
});

describe("useBillingSettings — reading the account's own currencies (AC-20)", () => {
  it("AC20 reads the account currency and payment preference off the session's own account", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    const accountObserved = observeAccountRequests();

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await settings.useActions().isReady();

    accountObserved.stop();

    const account = sessionAccount();
    expect(settings.useContext().accountId.value).toBe(account.id);
    expect(settings.useContext().currencyId.value).toBe(account.currency_id);
    expect(settings.useContext().preferredPaymentCurrencyId.value).toBe(
      account.preferred_payment_currency_id
    );
    expect(accountObserved.all()).toHaveLength(0);

    settings.useActions().destroy();
  });

  it("AC20 (a preference IS set) exposes the real saved preferred currency, never a placeholder", async () => {
    const { clientId, accountId, preferredCurrencyId } =
      await seedClientSessionWithPreferredCurrencySet();
    installSettingsGetHandler(server, clientId, recorded.settings());

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    await settings.useActions().isReady();

    expect(settings.useContext().accountId.value).toBe(accountId);
    expect(settings.useContext().preferredPaymentCurrencyId.value).toBe(
      preferredCurrencyId
    );

    settings.useActions().destroy();
  });
});

describe("useBillingSettingsManager — setting and clearing the preferred payment currency (AC-21)", () => {
  it("AC21 sets and clears the preferred payment currency on PUT accounts/{accountId}", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const accountId = sessionAccount().id;
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandGatesHandler(
      server,
      brandGatesWith(data => ({ ...data, [B6_KEY]: true }))
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    expect(manager.useMeta().hasPaymentCurrencyChoice.value).toBe(true);

    const put = installAccountPutEchoHandler(server, accountId);
    const observed = observeAccountRequests();

    const currencies = recorded.brandSettings().data.currencies;
    const targetId = currencies.find(
      currency =>
        currency.id !== manager.useContext().baseModel.value.currencyId
    )!.id;

    await manager.useActions().input({ preferredPaymentCurrencyId: targetId });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.preferredPaymentCurrencyId).toBe(
        targetId
      )
    );
    await manager.useActions().update();

    expect(put.bodies()).toHaveLength(1);
    expect(Object.keys(put.bodies()[0])).toEqual([
      "preferred_payment_currency_id"
    ]);
    expect(put.bodies()[0]).toHaveProperty(
      "preferred_payment_currency_id",
      targetId
    );

    const request = observed.all().find(entry => entry.method === "PUT");
    expect(request).toBeDefined();
    assertAccountIdentityTransport(request!, accountId, accessToken);

    await manager.useActions().input({ preferredPaymentCurrencyId: null });
    await vi.waitFor(() =>
      expect(
        manager.useContext().model.value.preferredPaymentCurrencyId
      ).toBeNull()
    );
    await manager.useActions().update();

    expect(put.bodies()).toHaveLength(2);
    expect(Object.keys(put.bodies()[1])).toEqual([
      "preferred_payment_currency_id"
    ]);
    expect(put.bodies()[1]).toHaveProperty(
      "preferred_payment_currency_id",
      null
    );

    observed.stop();
    manager.useActions().destroy();
  });

  it("AC21 a no-op currency save issues zero requests", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandGatesHandler(
      server,
      brandGatesWith(data => ({ ...data, [B6_KEY]: true }))
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();

    const observed = observeAccountRequests();
    await manager.useActions().update();
    observed.stop();

    expect(observed.all().filter(entry => entry.method === "PUT")).toHaveLength(
      0
    );
    manager.useActions().destroy();
  });
});

describe("useBillingSettingsManager — changing the account's billing currency (AC-22)", () => {
  it("AC22 changes the account billing currency on PUT accounts/{accountId}", async () => {
    const { clientId } = await seedClientSession();
    const accountId = sessionAccount().id;
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandGatesHandler(server);

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    const put = installAccountPutEchoHandler(server, accountId);

    const baseCurrencyId = manager.useContext().baseModel.value.currencyId;
    const currencies = recorded.brandSettings().data.currencies;
    const newCurrencyId = currencies.find(
      currency => currency.id !== baseCurrencyId
    )!.id;

    await manager.useActions().input({ currencyId: newCurrencyId });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.currencyId).toBe(newCurrencyId)
    );
    await manager.useActions().update();

    expect(put.bodies()).toHaveLength(1);
    expect(Object.keys(put.bodies()[0])).toEqual(["currency_id"]);
    manager.useActions().destroy();
  });

  it("AC22 changing both currencies together produces one request whose body key set is exactly both keys", async () => {
    const { clientId } = await seedClientSession();
    const accountId = sessionAccount().id;
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandGatesHandler(
      server,
      brandGatesWith(data => ({ ...data, [B6_KEY]: true }))
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    const put = installAccountPutEchoHandler(server, accountId);

    const baseCurrencyId = manager.useContext().baseModel.value.currencyId;
    const currencies = recorded.brandSettings().data.currencies;
    const newCurrencyId = currencies.find(
      currency => currency.id !== baseCurrencyId
    )!.id;
    const newPreferredId = currencies.find(
      currency =>
        currency.id !== baseCurrencyId && currency.id !== newCurrencyId
    )!.id;

    await manager.useActions().input({
      currencyId: newCurrencyId,
      preferredPaymentCurrencyId: newPreferredId
    });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.currencyId).toBe(newCurrencyId)
    );
    await manager.useActions().update();

    expect(put.bodies()).toHaveLength(1);
    expect(new Set(Object.keys(put.bodies()[0]))).toEqual(
      new Set(["currency_id", "preferred_payment_currency_id"])
    );
    manager.useActions().destroy();
  });
});

describe("useBillingSettings — the preferred-currency choice is offered only on a truthy brand opt-in (AC-23)", () => {
  it.each([
    {
      label: "absent",
      override: (data: BrandGatesEnvelope["data"]) => {
        const next = { ...data };
        delete next[B6_KEY];
        return next;
      },
      expectChoice: false
    },
    {
      label: "false",
      override: (data: BrandGatesEnvelope["data"]) => ({
        ...data,
        [B6_KEY]: false
      }),
      expectChoice: false
    },
    {
      label: "true",
      override: (data: BrandGatesEnvelope["data"]) => ({
        ...data,
        [B6_KEY]: true
      }),
      expectChoice: true
    }
  ])(
    "AC23 offers the payment-currency choice only on an explicit truthy brand opt-in — $label",
    async ({ override, expectChoice }) => {
      const { clientId } = await seedClientSession();
      installSettingsGetHandler(server, clientId, recorded.settings());
      installBrandGatesHandler(server, brandGatesWith(override));

      const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
      await settings.useActions().isReady();

      await vi.waitFor(() =>
        expect(settings.useMeta().hasPaymentCurrencyChoice.value).toBe(
          expectChoice
        )
      );
      // The real recorded O8 value on this brand is `false` (visible) — the
      // B6 override above must never move it (the two gates are disjoint).
      expect(settings.useMeta().isVisible.value).toBe(true);

      settings.useActions().destroy();
    }
  );

  it("AC23 refuses a preferred-currency write with zero requests while the gate is closed", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandGatesHandler(
      server,
      brandGatesWith(data => ({ ...data, [B6_KEY]: false }))
    );

    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await manager.useActions().isReady();
    expect(manager.useMeta().hasPaymentCurrencyChoice.value).toBe(false);

    const currencies = recorded.brandSettings().data.currencies;
    const baseCurrencyId = manager.useContext().baseModel.value.currencyId;
    const targetId = currencies.find(
      currency => currency.id !== baseCurrencyId
    )!.id;

    const observed = observeAccountRequests();
    await manager.useActions().input({ preferredPaymentCurrencyId: targetId });
    await manager
      .useActions()
      .update()
      .catch(() => undefined);
    observed.stop();

    expect(observed.all().filter(entry => entry.method === "PUT")).toHaveLength(
      0
    );
    manager.useActions().destroy();
  });
});

describe("useBillingSettings — the account-currency capability is withheld for a non-self client (AC-25)", () => {
  it("AC25 withholds the account-currency capability when the addressed client is not the session's own", async () => {
    const { clientId } = await seedClientSession();
    installSettingsGetHandler(server, clientId, recorded.settings());

    const otherClientFixture = recorded.settings();
    const otherClientEnvelope: Envelope<IClient> = {
      ...otherClientFixture,
      data: { ...otherClientFixture.data, id: OTHER_CLIENT_ID }
    };
    server?.use(
      http.get(`*/clients/${OTHER_CLIENT_ID}`, () =>
        HttpResponse.json(otherClientEnvelope, { status: 200 })
      )
    );

    const retargetedSettings = useBillingSettings()
      .as(ScopeActorTypes.CLIENT)
      .withId(OTHER_CLIENT_ID);
    const retargetedManager = useBillingSettingsManager()
      .as(ScopeActorTypes.CLIENT)
      .withId(OTHER_CLIENT_ID);
    await Promise.all([
      retargetedSettings.useActions().isReady(),
      retargetedManager.useActions().isReady()
    ]);

    expect(retargetedSettings.useContext().accountId.value).toBeUndefined();
    expect(retargetedSettings.useMeta().hasPaymentCurrencyChoice.value).toBe(
      false
    );
    expect(retargetedManager.useMeta().hasPaymentCurrencyChoice.value).toBe(
      false
    );

    const observed = observeAccountRequests();
    await retargetedManager.useActions().input({ currencyId: "irrelevant" });
    await retargetedManager
      .useActions()
      .update()
      .catch(() => undefined);
    observed.stop();

    expect(observed.all().filter(entry => entry.method === "PUT")).toHaveLength(
      0
    );
    retargetedSettings.useActions().destroy();
    retargetedManager.useActions().destroy();
  });
});

describe("useBillingSettings — the saved payment currency is what the next read and the shared session see (AC-26)", () => {
  it("AC26 the saved payment currency is what the next read and the currency-precedence consumer see", async () => {
    const { clientId } = await seedClientSession();
    const accountId = sessionAccount().id;
    installSettingsGetHandler(server, clientId, recorded.settings());
    installBrandGatesHandler(
      server,
      brandGatesWith(data => ({ ...data, [B6_KEY]: true }))
    );

    const settings = useBillingSettings().as(ScopeActorTypes.CLIENT);
    const manager = useBillingSettingsManager().as(ScopeActorTypes.CLIENT);
    await Promise.all([
      settings.useActions().isReady(),
      manager.useActions().isReady()
    ]);
    installAccountPutEchoHandler(server, accountId);

    const currencies = recorded.brandSettings().data.currencies;
    const baseCurrencyId = manager.useContext().baseModel.value.currencyId;
    const newPreferredId = currencies.find(
      currency => currency.id !== baseCurrencyId
    )!.id;

    await manager
      .useActions()
      .input({ preferredPaymentCurrencyId: newPreferredId });
    await vi.waitFor(() =>
      expect(manager.useContext().model.value.preferredPaymentCurrencyId).toBe(
        newPreferredId
      )
    );
    await manager.useActions().update();

    await vi.waitFor(() =>
      expect(settings.useContext().preferredPaymentCurrencyId.value).toBe(
        newPreferredId
      )
    );

    // The shared data the app-wide currency-precedence consumer
    // (basket-currency's accountCurrency()) itself reads — proven through
    // session-store's OWN public surface, never reimplemented here.
    const activeUser = useActiveSession().useContext().activeUser;
    await vi.waitFor(() =>
      expect(activeUser.value?.accounts?.[0]?.preferredPaymentCurrencyId).toBe(
        newPreferredId
      )
    );

    settings.useActions().destroy();
    manager.useActions().destroy();
  });
});
