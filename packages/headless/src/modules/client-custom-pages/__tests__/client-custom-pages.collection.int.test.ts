// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-pages — the collection's wire mechanics
 * (AC-1, AC-8, AC-9, O6, O12, O13, O16, B1, B2, W1)
 *
 * ## Job To Be Done
 * Prove the collection's request shape and recorded content against the real
 * `GET api/custom_pages`, which now returns ONE configured page (`total:1`,
 * slug `custom-page`, `show_on_menu:true` — `client-custom-pages.fixtures.ts`
 * header, 2026-10-06). Most assertions are about the SHAPE of the
 * request/lifecycle (URL, params, token, flags); the O25 block additionally
 * asserts the recorded row is exposed with its `show_on_menu` flag and records
 * that the menu-filter wire honouring stays INDETERMINATE on a single
 * all-shown page. The AC-2 menu-NARROWING scenario (seeing hidden pages, then
 * excluding them) stays `@todo`: it needs a `show_on_menu:false` page the
 * recording brand does not yet publish. Translation fallback over a recorded
 * row stays the unit mapper's job (the one row's `*_translated` is populated).
 *
 * ## What Breaks If These Fail
 * AC-1: a URL typo silently starts reading the wrong resource (or the admin
 * path). O6/B1: a re-introduced `default: PAGINATION.limit` silently
 * truncates every list read to 10 rows again (FE-3103). B2: the playground's
 * filter/sort surface silently goes dead because `schemas.query` is a stub
 * (`useModulePort.ts`'s `ownsQueryState()` gate). W1: narrowing by one filter
 * silently drops another already-set filter from the wire. AC-9: the list
 * starts attaching a token, breaking the guest-boot read legacy performs
 * before any session exists. AC-8/O16: `refresh()` silently serves the stale
 * cache, `destroy()` leaves a torn-down scope still being served by a
 * re-mint, or a background re-read reports as indistinguishable from a first
 * load.
 */

import { delay, http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useClientCustomPages } from "..";
import {
  bootUnauthenticated,
  observeCustomPagesRequests,
  recorded,
  resetClientCustomPagesScopes,
  seedClientSession,
  server
} from "./client-custom-pages.int-helpers";

// -----------------------------------------------------------------------------

afterEach(() => {
  resetClientCustomPagesScopes();
});

describe("client-custom-pages collection — request shape", () => {
  it("reads the brand custom pages from api/custom_pages, on the client path (AC-1)", async () => {
    await bootUnauthenticated();
    const observed = observeCustomPagesRequests();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();
    observed.stop();

    const requests = observed.matching("/api/custom_pages");
    expect(requests).toHaveLength(1);
    expect(new URL(requests[0].url).pathname).toBe("/api/custom_pages");
    expect(requests[0].method).toBe("GET");
    // N2 fix: `toEqual(recorded.list().data)` alone is `[] === []` on this
    // brand's genuinely empty fixture — it stays green under a 404, a wrong
    // URL, or a mapper that never ran, because D3 also empties `data` on
    // error. Asserting the ABSENCE of an error is what actually
    // distinguishes "the read succeeded with zero rows" from "the read
    // failed and data defaulted empty".
    expect(pages.useContext().error.value).toBeUndefined();
    expect(pages.useMeta().hasError.value).toBe(false);
  });

  it("the unnarrowed list read asks for the unpaged window and carries no filter or sort param (O6, B1 — FE-3103 re-introduction guard)", async () => {
    await bootUnauthenticated();
    const observed = observeCustomPagesRequests();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();
    observed.stop();

    const [request] = observed.matching("/api/custom_pages");
    const params = new URL(request.url).searchParams;

    // The unpaged window is POSITIVELY `limit=0`/`offset=0` — this
    // platform's own "give me everything" idiom (precedent:
    // client-company.paging-door.int.test.ts:54,
    // client-address.criteria-defaults.int.test.ts), not an absent key. A
    // regression back to `default: PAGINATION.limit` reads "10" here, not
    // "0" — this assertion goes red on that regression.
    expect(params.get("limit")).toBe("0");
    expect(params.get("offset")).toBe("0");

    // O6's real content: no filter or sort key reaches an unnarrowed read.
    // `lang` is a platform-added param on every request, not this module's
    // business, and is deliberately not asserted on here.
    const criteriaKeys = [...params.keys()].filter(
      key => key.startsWith("filter") || key.startsWith("sort")
    );
    expect(criteriaKeys).toEqual([]);
  });

  it("the list read carries no Authorization header — no session exists (AC-9)", async () => {
    await bootUnauthenticated();
    const observed = observeCustomPagesRequests();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();
    observed.stop();

    const [request] = observed.matching("/api/custom_pages");
    expect(
      request.headers.authorization ?? request.headers.Authorization
    ).toBeUndefined();
  });

  it("the list read carries no Authorization header — a client session IS active (AC-9)", async () => {
    await seedClientSession();
    const observed = observeCustomPagesRequests();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();
    observed.stop();

    const [request] = observed.matching("/api/custom_pages");
    expect(
      request.headers.authorization ?? request.headers.Authorization
    ).toBeUndefined();
  });
});

describe("client-custom-pages collection — the recorded page set and the menu filter (AC-2, O25)", () => {
  it("exposes every recorded page, including the one hidden from the menu (AC-2)", async () => {
    await bootUnauthenticated();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();

    const rows = pages.useContext().data.value;
    expect(rows).toHaveLength(recorded.list().total ?? 0);

    const shown = rows.find(r => r.slug === "custom-page");
    const hidden = rows.find(r => r.slug === "custom-page-invisible");
    expect(shown).toMatchObject({ showOnMenu: true });
    expect(hidden).toMatchObject({ showOnMenu: false });
  });

  it("narrows to the menu client-side — includes the shown page, excludes the hidden one (AC-2)", async () => {
    await bootUnauthenticated();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();

    const rows = pages.useContext().data.value;
    const menuSlugs = rows.filter(r => r.showOnMenu).map(r => r.slug);
    expect(menuSlugs).toContain("custom-page");
    expect(menuSlugs).not.toContain("custom-page-invisible");
  });

  it("the show_on_menu wire filter is honoured on the EXACT key the module emits — filter[show_on_menu|eq]=1 returns only menu rows, excluding the hidden page (O25, Direct)", () => {
    // Asserts the recording of the operator form the module actually sends
    // (filter[show_on_menu|eq]=1 — the snake_case wire key after the camelCase
    // defect was fixed), not the plain form. The bare read carries the hidden
    // page; the |eq-filtered read drops it and carries only show_on_menu:true
    // rows — so the API honours the real key. Goes RED if a future recording
    // shows the filtered read leaking a hidden row. parity.yaml O25 → Direct.
    const bareSlugs = recorded.list().data.map(r => r.slug);
    const filtered = recorded.menuFilterEqProbe().data;

    expect(bareSlugs).toContain("custom-page-invisible");
    expect(filtered.every(r => r.show_on_menu === true)).toBe(true);
    expect(filtered.map(r => r.slug)).not.toContain("custom-page-invisible");
    expect(filtered.map(r => r.slug)).toContain("custom-page");
  });
});

describe("client-custom-pages collection — the published schema family is real, not stubbed (B2, ADR-032)", () => {
  it("publishes schema, uischema and sortUischema as real JSONForms objects", async () => {
    await bootUnauthenticated();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();

    const { schemas } = pages.useContext();

    // Real Draft-07 schema, not an empty stub: the two declared filters and
    // the sort/pagination branches are all present as actual properties.
    expect(schemas.query.schema.type).toBe("object");
    const schemaProps = schemas.query.schema.properties as Record<
      string,
      unknown
    >;
    expect(schemaProps).toHaveProperty("filters");
    expect(schemaProps).toHaveProperty("sort");
    expect(schemaProps).toHaveProperty("pagination");

    // Real UISchema for the filter bar — was unreachable dead code before
    // B2; a stub here silently disables the playground's filter surface
    // (useModulePort.ts's ownsQueryState() gate, per the prover's brief).
    expect(schemas.query.uischema.type).toBe("FilterBar");
    expect(
      (schemas.query.uischema as { elements?: unknown[] }).elements?.length
    ).toBeGreaterThan(0);

    // Real sort UISchema — the ADR-032 2026-08-18 amendment's third member.
    expect(schemas.query.sortUischema.type).toBe("Control");
    expect(schemas.query.sortUischema.scope).toBe("#/properties/sort");
  });
});

describe("client-custom-pages collection — both filters survive together on the wire (W1)", () => {
  it("filters.showOnMenu(true) then filters.slug('about') both stay on the request — neither clears the other", async () => {
    await bootUnauthenticated();
    const observed = observeCustomPagesRequests();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();

    pages.useActions().filters.showOnMenu(true);
    pages.useActions().filters.slug("about");

    await vi.waitFor(() => {
      const requests = observed.matching("/api/custom_pages");
      expect(requests.length).toBeGreaterThanOrEqual(2);
    });
    observed.stop();

    const requests = observed.matching("/api/custom_pages");
    const lastParams = new URL(requests[requests.length - 1].url).searchParams;

    // W1 regression guard: criteria previously merged at branch level, so
    // setting `slug` after `showOnMenu` silently dropped the menu narrowing
    // from the wire. Both keys must be present on the SAME request.
    //
    // The menu filter's WIRE key is snake_case `show_on_menu` (the API's own
    // column), not the camelCase public verb `filters.showOnMenu`; the old
    // `filter[showOnMenu|eq]` the API did not know must never be sent.
    expect(lastParams.get("filter[show_on_menu|eq]")).toBe("1");
    expect(lastParams.get("filter[showOnMenu|eq]")).toBeNull();
    expect(lastParams.get("filter[slug|eq]")).toBe("about");
  });
});

describe("client-custom-pages collection — refresh and teardown (O12/O13, AC-8)", () => {
  it("refresh() issues a second request rather than serving the cached read", async () => {
    await bootUnauthenticated();
    const observed = observeCustomPagesRequests();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();
    await pages.useActions().refresh();
    observed.stop();

    expect(observed.matching("/api/custom_pages")).toHaveLength(2);
  });

  it("destroy() releases the scope entry; a fresh mint is a different instance, not the torn-down scope", async () => {
    // Matches the established sibling precedent
    // (client-email-history.lifecycle.int.test.ts AC-12): destroy() is
    // proven at the scope-registry level (a fresh mint is NOT the same
    // instance), not by asserting a network request fires on re-mint —
    // TanStack's platform-wide 5-minute staleTime (query/client.ts) means a
    // re-mint under the same query key legitimately serves cached data
    // without refetching, independent of this module. See the prover's
    // report for the AC-8 wording this bears on.
    await bootUnauthenticated();
    const first = useClientCustomPages();
    await first.useActions().isReady();

    first.useActions().destroy();
    const second = useClientCustomPages();

    expect(second).not.toBe(first);
  });
});

describe("client-custom-pages collection — isLoading vs isReloading are distinguishable (O16, AC-8)", () => {
  afterEach(() => server?.resetHandlers());

  it("isReloading is true and isLoading stays false during a background re-read after the first load completed", async () => {
    await bootUnauthenticated();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();

    expect(pages.useMeta().isLoading.value).toBe(false);
    expect(pages.useMeta().isReloading.value).toBe(false);

    server?.use(
      http.get("*/api/custom_pages", async () => {
        await delay(150);
        return HttpResponse.json(recorded.list());
      })
    );

    const refreshed = pages.useActions().refresh();

    await vi.waitFor(() => {
      expect(pages.useMeta().isReloading.value).toBe(true);
    });
    expect(pages.useMeta().isLoading.value).toBe(false);

    await refreshed;
    expect(pages.useMeta().isReloading.value).toBe(false);
  });
});
