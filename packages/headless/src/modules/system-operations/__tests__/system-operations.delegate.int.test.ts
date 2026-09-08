// -----------------------------------------------------------------------------
/**
 * @fileoverview systemOperations — a held operation resumes REAL work across a
 * reload (AC-2, AC-6)
 *
 * ## Job To Be Done
 * The registry's whole reason to exist is that work interrupted by an off-site
 * redirect finishes when the payer comes back. Every other spec in this module
 * proves a gear — an oid is minted, a payload round-trips, a slot is claimed.
 * None of them proves the point: that the work actually happens.
 *
 * So this one holds an operation, throws the module away as a reload does, and
 * dispatches it into a REAL composable — `useLocale().setLocale`. The assertion
 * is that composable's own observable state, not a spy: the locale is `fr`
 * afterwards, and the document says so too.
 *
 * `useLocale` is the delegate because it is real, in-tree, and needs no network
 * to observe — the resume mechanism is what is under test, not the payment
 * domain. A `vi.fn()` here would only prove the registry calls A function; it
 * would say nothing about work being done.
 *
 * ## What Breaks If These Fail
 * A payer completes 3DS at their bank, returns, and the thing they were doing
 * silently never finishes — the card is not stored, the invoice is not settled —
 * while every gear-level test in this module stays green.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";
import { useI18n } from "../../system-localisation/useI18n";
import { useLocale } from "../../system-localisation/useLocale";

// -----------------------------------------------------------------------------

const STORAGE_KEY = "upmind:operations";

/** The key the resume registers under — a locale change, held across the trip. */
const SET_LOCALE_KEY = "test-set-locale";

beforeEach(async () => {
  sessionStorage.clear();
  localStorage.clear();

  // The real setter drives vue-i18n, so give it a real instance. Messages are
  // irrelevant here — the locale it settles on is what this file asserts.
  useI18n().init(
    createI18n({ legacy: false, locale: "en", fallbackLocale: "en" })
  );

  await useLocale().setLocale("en");
});

// -----------------------------------------------------------------------------

describe("systemOperations — a held operation resumes real work", () => {
  it("AC-2 · AC-6 · dispatches a rehydrated operation into a real composable, and the composable's own state changes", async () => {
    const { createOperation } = (
      await import("../useOperations")
    ).useOperations();

    // 1. Before the trip: hold the work, and prove the starting state is not
    //    the one we are about to assert.
    expect(useLocale().locale.value).toBe("en");
    const oid = createOperation(SET_LOCALE_KEY, { locale: "fr" });
    expect(sessionStorage.getItem(STORAGE_KEY)).toContain(oid);

    // 2. The trip. A redirect tears the page down, so the registry's in-memory
    //    state goes with it — only sessionStorage survives.
    vi.resetModules();

    // 3. The return. A fresh page registers its handlers, then dispatches the
    //    reference the url carried. The handler is the REAL setter.
    const resumed = (await import("../useOperations")).useOperations();
    resumed.register(SET_LOCALE_KEY, async (payload: { locale: string }) =>
      useLocale().setLocale(payload.locale)
    );

    await resumed.executeOperation(oid);

    // 4. The proof: the delegate's own state, not a spy call count.
    expect(useLocale().locale.value).toBe("fr");
    expect(document.querySelector("html")?.getAttribute("lang")).toBe("fr");

    // The operation is spent, so a refresh cannot run it twice.
    expect(resumed.getOperation(oid)).toBeNull();
  });

  it("AC-6 · carries the payload across the reload, not just the reference", async () => {
    const { createOperation } = (
      await import("../useOperations")
    ).useOperations();
    const oid = createOperation(SET_LOCALE_KEY, { locale: "de" });

    vi.resetModules();

    const resumed = (await import("../useOperations")).useOperations();
    const seen: unknown[] = [];
    resumed.register(SET_LOCALE_KEY, async (payload: { locale: string }) => {
      seen.push(payload);
      return useLocale().setLocale(payload.locale);
    });

    await resumed.executeOperation(oid);

    // The handler received what was held BEFORE the reload, byte for byte.
    expect(seen).toStrictEqual([{ locale: "de" }]);
    expect(useLocale().locale.value).toBe("de");
  });
});
