// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-pages — the single read's by-slug resolve (AC-3),
 * its typed absence (AC-5), token transport (D2/N7), the template-handoff id
 * (AC-6/O31), and the O9/O10 short-circuit (AC-4, both halves)
 *
 * ## Job To Be Done
 * Prove the single read against the real `api/custom_pages/{slug}` path
 * segment, now that the recording brand has ONE configured page
 * (`client-custom-pages.fixtures.ts` header, 2026-10-06):
 *  - AC-3/O7: `.withId("custom-page")` resolves the recorded 200 row — id,
 *    title, menuLabel, slug mapped — on the path segment, with zero
 *    `filter[...]` keys on the wire.
 *  - AC-6/O31: the resolved page exposes the exact `id` a consumer hands to
 *    the already-shipped `useClientTemplate` as `objectId` (the module owes the
 *    id; the render seam itself lives in `system-client-area` and is not
 *    reachable from this module's public surface — see the prover's report).
 *  - AC-5/O18: an unknown slug surfaces as typed absence, never a throw.
 *  - D2/N7: the single read carries the signed-in client's own Authorization
 *    header, unlike the token-free list.
 *  - AC-4/O9/O10: a slug already on a mounted collection resolves with NO
 *    item request, data falling back to the list row, while `refresh()` still
 *    reaches the wire; and a slug ABSENT from a mounted collection still
 *    issues its own request (the guard does not over-suppress).
 *
 * ## What Breaks If These Fail
 * AC-3: the by-slug resolve reads the wrong resource or drops a mapped member,
 * so a deep-linked page renders with no title/label. AC-5: a consumer opening
 * a dead link either crashes the client area (a thrown error slipping through)
 * or cannot distinguish "this page does not exist" from "the read failed for
 * some other reason" (a mis-mapped `error.status`). N7/D2: the single read
 * silently starts serving unauthenticated, or the parity asymmetry with the
 * token-free list quietly flattens. AC-4/O9: a redundant item request fires on
 * every menu click (the cache short-circuit is lost), or — the over-eager
 * inverse — the short-circuit silently swallows every single-read request once
 * ANY collection is mounted, resolving unknown slugs to nothing with no call.
 */

import { describe, expect, it } from "vitest";
import { useClientCustomPage, useClientCustomPages } from "..";
import {
  bootUnauthenticated,
  observeCustomPagesRequests,
  recorded,
  resetClientCustomPagesScopes,
  seedClientSession
} from "./client-custom-pages.int-helpers";
import { responseCodes } from "../../../utils";

// -----------------------------------------------------------------------------

describe("client-custom-pages single read — an unknown slug (AC-5)", () => {
  it("an unknown slug surfaces as absence, not a throw", async () => {
    await bootUnauthenticated();

    const page = useClientCustomPage().withId("no-such-page-xyz");
    await page.useActions().isReady();

    const { error, data } = page.useContext();
    expect(error.value?.status).toBe(responseCodes.Not_Found);
    expect(error.value?.status).toBe(recorded.notFound().error?.code);
    expect(data.value).toEqual([]);
    expect(page.useMeta().isNotFound.value).toBe(true);
    expect(page.useMeta().hasError.value).toBe(true);
  });

  it("resolves one custom page by slug on the path segment, not a filter", async () => {
    await bootUnauthenticated();
    const observed = observeCustomPagesRequests();

    const page = useClientCustomPage().withId("no-such-page-xyz");
    await page.useActions().isReady();
    observed.stop();

    const requests = observed.matching("/api/custom_pages/no-such-page-xyz");
    expect(requests).toHaveLength(1);

    const url = new URL(requests[0].url);
    expect(url.pathname).toBe("/api/custom_pages/no-such-page-xyz");
    const filterKeys = [...url.searchParams.keys()].filter(key =>
      key.startsWith("filter")
    );
    expect(filterKeys).toEqual([]);
  });
});

describe("client-custom-pages single read — resolves a recorded page by slug (AC-3, O7, O31)", () => {
  it("resolves the recorded 200 page by slug — id, title and menuLabel mapped — with zero filter keys on the wire", async () => {
    await bootUnauthenticated();
    const observed = observeCustomPagesRequests();

    const page = useClientCustomPage().withId("custom-page");
    await page.useActions().isReady();
    observed.stop();

    const requests = observed.matching("/api/custom_pages/custom-page");
    expect(requests).toHaveLength(1);
    const url = new URL(requests[0].url);
    expect(url.pathname).toBe("/api/custom_pages/custom-page");
    expect(
      [...url.searchParams.keys()].filter(key => key.startsWith("filter"))
    ).toEqual([]);

    const row = recorded.page().data;
    const resolved = page.useContext().data.value;
    expect(resolved).toMatchObject({
      id: row.id,
      slug: row.slug,
      title: row.title,
      menuLabel: row.menu_label,
      showOnMenu: row.show_on_menu
    });
    expect(page.useMeta().isNotFound.value).toBe(false);
    expect(page.useMeta().hasError.value).toBe(false);
  });

  it("exposes the resolved page id as the objectId a consumer hands to useClientTemplate (O31)", async () => {
    // AC-6's module-side obligation is exposing the id the client area's
    // EXISTING template surface renders by (useClientTemplate({ code:
    // CUSTOM_PAGE, objectId }), system-client-area). This module mints no
    // renderer and the PATCH to that surface is NOT reachable from this
    // module's public surface, so the AC-6 feature scenario stays @todo; what
    // IS reachable, and asserted here, is that the resolved page carries the
    // exact wire id a consumer passes as objectId. See the prover's report.
    await bootUnauthenticated();

    const page = useClientCustomPage().withId("custom-page");
    await page.useActions().isReady();

    expect(page.useContext().data.value?.id).toBe(recorded.page().data.id);
  });
});

describe("client-custom-pages single read — token transport (D2/N7)", () => {
  it("carries the signed-in client's own Authorization header, unlike the token-free list", async () => {
    const { accessToken } = await seedClientSession();
    const observed = observeCustomPagesRequests();

    const page = useClientCustomPage().withId("no-such-page-xyz");
    await page.useActions().isReady();
    observed.stop();

    const requests = observed.matching("/api/custom_pages/no-such-page-xyz");
    expect(requests).toHaveLength(1);
    expect(
      requests[0].headers.authorization ?? requests[0].headers.Authorization
    ).toBe(`Bearer ${accessToken}`);
  });
});

describe("client-custom-pages single read — the O9/O10 short-circuit (AC-4, B3)", () => {
  it("resolves a slug already on the mounted collection with ZERO item requests, data falling back to the list row; refresh() still fetches (AC-4)", async () => {
    resetClientCustomPagesScopes();
    await bootUnauthenticated();
    const observed = observeCustomPagesRequests();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();

    const page = useClientCustomPage().withId("custom-page");
    await page.useActions().isReady();
    observed.stop();

    // O9: the item door issues NO request for a slug already on the list.
    expect(observed.matching("/api/custom_pages/custom-page")).toHaveLength(0);

    // O10: context.data falls back to the already-resolved list row.
    const row = recorded.list().data.find(r => r.slug === "custom-page");
    expect(page.useContext().data.value).toMatchObject({
      id: row?.id,
      slug: "custom-page"
    });
    expect(page.useMeta().hasError.value).toBe(false);

    // O12/AC-8 escape hatch: refresh() bypasses the guard and DOES reach the wire.
    const afterShortCircuit = observeCustomPagesRequests();
    await page.useActions().refresh();
    afterShortCircuit.stop();
    expect(
      afterShortCircuit.matching("/api/custom_pages/custom-page")
    ).toHaveLength(1);
  });

  it("still issues its own request for a slug absent from an already-mounted collection", async () => {
    // The inverse boundary of AC-4: a mounted collection must NOT make the
    // single-read door silently swallow a request for a slug that was never in
    // it. `no-such-page-xyz` is not in the recorded single-row list, so the
    // guard must let its own request through.
    resetClientCustomPagesScopes();
    await bootUnauthenticated();
    const observed = observeCustomPagesRequests();

    const pages = useClientCustomPages();
    await pages.useActions().isReady();

    const page = useClientCustomPage().withId("no-such-page-xyz");
    await page.useActions().isReady();
    observed.stop();

    const listRequests = observed
      .all()
      .filter(r => new URL(r.url).pathname === "/api/custom_pages");
    expect(listRequests).toHaveLength(1);
    const itemRequests = observed.matching(
      "/api/custom_pages/no-such-page-xyz"
    );
    expect(itemRequests).toHaveLength(1);
    expect(page.useMeta().isNotFound.value).toBe(true);
  });
});
