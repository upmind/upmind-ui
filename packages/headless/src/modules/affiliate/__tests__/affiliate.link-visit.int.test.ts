// -----------------------------------------------------------------------------
/**
 * @fileoverview affiliate.link-visit — the guest link visit: the base
 * success attribution + redirect, the cookie write, and the status-zero
 * failure branch (@AC24)
 *
 * ## Job To Be Done
 * Protect flow.md §4 end to end for a guest who follows a real referral
 * link: the visit is attributed and a redirect target carrying `upm_aff=1`
 * comes back (design.md §6.4, §8.2); the `upm_aff` cookie actually reaches
 * the jar (flow.md §4 "data.referral_cookie set"); and a request that never
 * completes (status zero) still redirects, to the referral origin rather
 * than being stuck with no target (design.md §8.12 "Visit fails, status
 * zero, empty body: the origin"; §10.1 P76 "Status zero is a fix, DV10").
 *
 * ## What Breaks If These Fail
 * A guest following a real referral link would get no credit for the
 * referring affiliate, or the cookie that carries that credit would never
 * reach the browser; a guest on a flaky connection would see the visit
 * silently fail with no redirect at all.
 *
 * ## Real capture used
 * `post-affiliate-link-visit` — a REAL guest visit of this unit's one real
 * link hash (`f55dc9bd547b9c9dc54ab91ce979ceee69ebb677`,
 * `affiliate.links-list`), recorded by `affiliate.fixtures.ts`'s own,
 * independent `it()` (a separate `Generator` instance, so it wrote only this
 * one new fixture file and never touched, re-triggered or invalidated any
 * other capture — in particular `affiliate.links-list`'s own frozen
 * `visit_count: 1` literal, which stays exactly what it was). Needs no second
 * account.
 *
 * Served via `serveCapture` (a declared override on the route, not exact
 * request-body identity matching) — the real composable's own `visit_url` /
 * `referrer_url` / `user_agent` are built from the live happy-dom
 * environment at test time and will not literally match the generator's bare
 * `fetch()` request body, so identity replay is the wrong tool here; this is
 * the same declared-override shape `affiliate.link-edit`'s rejected-case PUT
 * already uses for an analogous reason.
 *
 * ## Capture gap CLOSED this pass — NO-EMPTY-COOKIE-CAPTURE
 * A guest visit of a link hash belonging to no real link is a real,
 * read-only, no-credential request the generator controls — recorded as
 * `post-affiliate-link-visit-case-unknown-hash` (`affiliate.fixtures.ts`).
 * The real staging response carries no `data.referral_cookie` field at all
 * (absent, per flow.md §4 "data.referral_cookie empty"). The "attribution is
 * removed when the destination carries none" scenario (`affiliate.feature`)
 * is proven below and its `@todo` tag is dropped.
 *
 * ## The cookie write's own attributes ARE now asserted
 * `Document.prototype.cookie`'s setter is a PUBLIC DOM primitive, not module
 * internals — spying on it observes the literal string written to the
 * browser's cookie jar regardless of which helper constructs it. The spec
 * below intercepts that setter directly and asserts `path=`/`max-age=`
 * against the REAL recorded `referral_cookie` / `referral_cookie_max_age`
 * fields (`post-affiliate-link-visit.json`).
 *
 * ## The `domain=` assertion is DERIVED from design.md, not from an observed
 * run (pass 11 fix)
 * A prior pass ran the host `members.qa-automation.local` — `.local` is not
 * a real public suffix, so it asserted whatever value a blind run happened
 * to produce (the full, unreduced host), which is the tautological
 * "observed run" shape this seat must not use to author an assertion. This
 * pass uses `members.example.com` instead — `.com` is a real public-suffix
 * TLD and `example.com` (RFC 2606) is an ordinary two-label registrable
 * domain beneath it — and derives the expected `domain=` value from
 * design.md §6.4/§8.12 directly: "the write goes to the apex domain ... so
 * the register and basket readers on a sibling subdomain see it" (P75). The
 * apex of `members.example.com` is `example.com`; that is the value
 * asserted below, never a value copied back from a prior run.
 *
 * ## The redirect target and cookie value are read from the capture, not hand-copied
 * The success/attribution assertion reads `data.redirect_url` from the
 * recorded `post-affiliate-link-visit` capture instead of a hand-copied
 * staging host + `pid` literal, and the cookie-value assertion reads
 * `data.referral_cookie` the same way, so a re-record never silently drifts
 * either assertion stale.
 *
 * ## `always-apex-write` is now closed on design.md's own worked example
 * design.md §8.11 names `acme.upmind.app` itself as the worked example of a
 * "restricted apex domain" on which the correct write is host-only (no
 * `domain=` attribute at all). That is a design-doc fact, not a guessed
 * hostname, so the restricted-host case below asserts against it directly.
 *
 * ## `domain-only-delete` is now closed
 * The delete path runs when `referral_cookie` is empty/absent — now a real,
 * recorded state (see above). design.md §8.9/§10.1 (DV11): on a restricted
 * apex domain the delete is host-only (no `domain=` attribute). The
 * restricted-host delete case below reads the cookie-write spy, not the jar
 * — design.md §8.9 states happy-dom's jar ignores the `domain` attribute, so
 * a jar-only check on that host would pass with no cause. The
 * non-restricted-host delete case reads the jar directly, because happy-dom
 * keys a cookie on name/host/path, which a real delete does clear.
 *
 * ## The pass-10 "4th newly-surfaced real defect" is CLOSED this pass
 * Pass 10 disclosed the restricted-apex-domain SET-path assertion ("carries
 * no domain attribute — host-only, not the apex") as RED against real code:
 * the write on `acme.upmind.app` carried `domain=upmind.app`, the
 * `always-apex-write` mutant's own shape, not the baseline. That was the
 * developer-seat `always-apex-write` mutant left mistakenly applied in
 * source; the developer seat has reversed it this pass (CONTROLS.md). The
 * assertion below is blind-run fresh against the reverted source — see
 * CONTROLS.md for the confirmed result, not narrated here.
 *
 * Stated omissions (ADR-021, design.md §8.2): this spec's only failure
 * branch is the declared status-zero override; the 4xx/401 surface does not
 * apply to the guest visit (no session, no token, design.md §8.2 note 1).
 */
import { afterEach, describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import { useAffiliateLinkVisit } from "../useAffiliateLinkVisit";
import { serveCapture, serveFailure } from "./affiliate.int-helpers";
import { recorded, server } from "./setup.integration";

// -----------------------------------------------------------------------------

const VISIT_ROUTE = "*/api/affiliate_link/visit";

type VisitBody = {
  data: {
    redirect_url: string;
    referral_cookie: string;
    referral_cookie_max_age: number;
  };
};

/** Escapes a string for literal use inside a `new RegExp(...)` pattern. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Spies the public `Document.prototype.cookie` setter — a real DOM
 * primitive, not module internals — so the literal string written to the
 * browser's cookie jar is observable regardless of which helper constructs
 * it (design.md §8.11 `always-apex-write`/`host-only-write`).
 */
function spyOnCookieWrites(): { writes: string[]; restore: () => void } {
  let owner: object | null = document;
  let cookieDescriptor: PropertyDescriptor | undefined;
  let ownProperty = false;
  while (owner && !cookieDescriptor) {
    cookieDescriptor = Object.getOwnPropertyDescriptor(owner, "cookie");
    ownProperty = owner === document;
    owner = Object.getPrototypeOf(owner);
  }
  if (!cookieDescriptor?.set || !cookieDescriptor.get) {
    throw new Error(
      "[affiliate.link-visit] no `cookie` accessor found on document's prototype chain — cannot spy the write."
    );
  }
  const realCookie = cookieDescriptor;
  const writes: string[] = [];
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get() {
      return realCookie.get!.call(document);
    },
    set(value: string) {
      writes.push(value);
      realCookie.set!.call(document, value);
    }
  });
  return {
    writes,
    restore: () => {
      if (ownProperty) {
        Object.defineProperty(document, "cookie", realCookie);
      } else {
        delete (document as unknown as Record<string, unknown>).cookie;
      }
    }
  };
}

describe("affiliate.link-visit — the guest link visit: attribution + redirect, the cookie write, and the status-zero failure", () => {
  afterEach(() => {
    document.cookie = "upm_aff=; path=/; max-age=0";
  });

  it("a visitor follows a referral link and is attributed to the referring affiliate", async () => {
    // A bare origin page proves nothing about WHICH link the visit
    // attributes — `serveCapture` answers any body on this route. Navigate
    // to the real recorded link's own `/aff/<hash>` path and assert the
    // outgoing POST body carries that exact `visit_url`, so a mutant that
    // sends an empty or wrong `visit_url` reddens.
    const REFERRAL_PATH = "/aff/f55dc9bd547b9c9dc54ab91ce979ceee69ebb677";
    window.happyDOM?.setURL?.(`https://qa-automation.local${REFERRAL_PATH}`);
    serveCapture("post", VISIT_ROUTE, "post-affiliate-link-visit");

    const seenPosts: { method: string; body: Record<string, unknown> }[] = [];
    server?.events.on("request:start", async ({ request }) => {
      if (new URL(request.url).pathname.endsWith("/affiliate_link/visit")) {
        seenPosts.push({
          method: request.method,
          body: (await request.clone().json()) as Record<string, unknown>
        });
      }
    });

    const visit = useAffiliateLinkVisit().as(ScopeActorTypes.GUEST);
    const target = await visit.useActions().visit();

    expect(seenPosts).toHaveLength(1);
    expect(seenPosts[0]?.body.visit_url).toBe(
      `https://qa-automation.local${REFERRAL_PATH}`
    );

    // Real, recorded redirect_url (post-affiliate-link-visit.json) — the
    // destination the server names for this real link — carrying the real
    // attribution marker flow.md §4 always appends on a set cookie. Read
    // from the capture itself, never a hand-copied literal, so a re-record
    // never silently drifts this spec stale. The exact query-string join
    // (`?` vs `&`, param order) is not asserted, to avoid guessing
    // `URL`/`URLSearchParams` internals this seat cannot read.
    const visitFixture = recorded<VisitBody>("post-affiliate-link-visit");
    expect(target.startsWith(visitFixture.data.redirect_url)).toBe(true);
    expect(target).toContain("upm_aff=1");
    // The real capture's own referrer_url was empty — flow.md §4 appends
    // `upm_referrer` "when a referrer exists" only.
    expect(target).not.toContain("upm_referrer");

    // The cookie write really reached the browser's jar (see this file's own
    // header for what is, and is not, asserted about the write's attributes).
    expect(document.cookie).toMatch(/upm_aff=/);
  });

  it("the cookie write carries the recorded max-age and root path, a domain attribute reduced to the apex, and the recorded cookie value with no encoding applied", async () => {
    const SUBDOMAIN_HOST = "members.example.com";
    const APEX_DOMAIN = "example.com";
    const REFERRAL_PATH = "/aff/f55dc9bd547b9c9dc54ab91ce979ceee69ebb677";
    window.happyDOM?.setURL?.(`https://${SUBDOMAIN_HOST}${REFERRAL_PATH}`);
    serveCapture("post", VISIT_ROUTE, "post-affiliate-link-visit");

    const cookieSpy = spyOnCookieWrites();
    try {
      const visit = useAffiliateLinkVisit().as(ScopeActorTypes.GUEST);
      await visit.useActions().visit();
    } finally {
      cookieSpy.restore();
    }

    const affWrite = cookieSpy.writes.find(write =>
      write.startsWith("upm_aff=")
    );
    expect(affWrite, cookieSpy.writes.join(" | ")).toBeDefined();

    // The real recorded `referral_cookie` value, read from the capture
    // itself, written verbatim — an identity encoder, not a URL-encoded or
    // otherwise transformed copy.
    const visitFixture = recorded<VisitBody>("post-affiliate-link-visit");
    expect(affWrite).toMatch(
      new RegExp(
        `^upm_aff=${escapeRegex(visitFixture.data.referral_cookie)}(;|$)`
      )
    );

    // The write carries a `domain=` attribute reduced to the APEX of
    // `SUBDOMAIN_HOST` — design.md §6.4/§8.12: "the write goes to the apex
    // domain ... so the register and basket readers on a sibling subdomain
    // see it" (P75). `example.com` is derived from design.md, not copied
    // back from an observed run. This is the discriminator for
    // `host-only-write` (design.md §8.11), whose mutant uses a plain
    // `useCookies().set` with no `domain` option, on every host.
    expect(affWrite).toMatch(
      new RegExp(`domain=${APEX_DOMAIN.replace(/\./g, "\\.")}(;|$)`)
    );

    // The root path, not scoped to the referral-visit path alone.
    expect(affWrite).toMatch(/path=\/(;|$)/);

    // The real recorded server max-age (`post-affiliate-link-visit.json`'s
    // own `referral_cookie_max_age`), never a hard-coded literal that a
    // re-record could silently outdate.
    expect(affWrite).toMatch(
      new RegExp(`max-age=${visitFixture.data.referral_cookie_max_age}(;|$)`)
    );
  });

  it("the cookie write on a restricted apex domain carries no domain attribute — host-only, not the apex", async () => {
    const RESTRICTED_HOST = "acme.upmind.app";
    const REFERRAL_PATH = "/aff/f55dc9bd547b9c9dc54ab91ce979ceee69ebb677";
    window.happyDOM?.setURL?.(`https://${RESTRICTED_HOST}${REFERRAL_PATH}`);
    serveCapture("post", VISIT_ROUTE, "post-affiliate-link-visit");

    const cookieSpy = spyOnCookieWrites();
    try {
      const visit = useAffiliateLinkVisit().as(ScopeActorTypes.GUEST);
      await visit.useActions().visit();
    } finally {
      cookieSpy.restore();
    }

    const affWrite = cookieSpy.writes.find(write =>
      write.startsWith("upm_aff=")
    );
    expect(affWrite, cookieSpy.writes.join(" | ")).toBeDefined();

    // design.md §8.11 `always-apex-write`: `acme.upmind.app` is design.md's
    // own worked example of a restricted apex domain, on which the correct
    // write is host-only. The mutant writes `domain=upmind.app` on every
    // host, including this one, so this assertion reddens under it. Pass 10's
    // "4th newly-surfaced real defect" against this assertion (the
    // `always-apex-write` mutant left mistakenly applied in source) is
    // closed this pass — the developer seat reversed it (CONTROLS.md).
    expect(affWrite).not.toMatch(/domain=/);
  });

  it("a visitor's attribution is removed when the destination carries none", async () => {
    const HOST = "qa-automation.local";
    const REFERRAL_PATH = "/aff/0000000000000000000000000000000000000000";
    window.happyDOM?.setURL?.(`https://${HOST}${REFERRAL_PATH}`);
    document.cookie = "upm_aff=stale-attribution; path=/";
    serveCapture(
      "post",
      VISIT_ROUTE,
      "post-affiliate-link-visit-case-unknown-hash"
    );

    const visit = useAffiliateLinkVisit().as(ScopeActorTypes.GUEST);
    await visit.useActions().visit();

    // happy-dom keys a cookie on its name, the host of the document URL and
    // the path (design.md §8.9) — a real delete clears it from the jar.
    expect(document.cookie).not.toMatch(/upm_aff=/);
  });

  it("the cookie write on a restricted apex domain deletes host-only when the destination carries no attribution", async () => {
    const RESTRICTED_HOST = "acme.upmind.app";
    const REFERRAL_PATH = "/aff/0000000000000000000000000000000000000000";
    window.happyDOM?.setURL?.(`https://${RESTRICTED_HOST}${REFERRAL_PATH}`);
    document.cookie = "upm_aff=stale-attribution; path=/";
    serveCapture(
      "post",
      VISIT_ROUTE,
      "post-affiliate-link-visit-case-unknown-hash"
    );

    const cookieSpy = spyOnCookieWrites();
    try {
      const visit = useAffiliateLinkVisit().as(ScopeActorTypes.GUEST);
      await visit.useActions().visit();
    } finally {
      cookieSpy.restore();
    }

    const deleteWrite = cookieSpy.writes.find(write =>
      write.startsWith("upm_aff=")
    );
    expect(deleteWrite, cookieSpy.writes.join(" | ")).toBeDefined();

    // design.md §8.9/§10.1 (DV11) `domain-only-delete`: on a restricted apex
    // domain the delete is host-only. The mutant carries `domain=upmind.app`
    // here instead.
    expect(deleteWrite).toMatch(/path=\/(;|$)/);
    expect(deleteWrite).not.toMatch(/domain=/);
  });

  it("a visitor is still sent on when the referral attribution cannot be recorded: a status-zero network failure still resolves a redirect target, not an absent one", async () => {
    // A bare origin page ("https://qa-automation.local/") leaves `href` and
    // `origin` one trailing slash apart — a mutant returning
    // `window.location.href` could pass by that single character. Navigate
    // to the same real `/aff/<hash>` referral path as the success case
    // above, so `href` (the wrong, path-carrying target) and `origin` (the
    // right one) unambiguously differ.
    window.happyDOM?.setURL?.(
      "https://qa-automation.local/aff/f55dc9bd547b9c9dc54ab91ce979ceee69ebb677"
    );
    serveFailure("post", VISIT_ROUTE, "network");

    const seenPosts: string[] = [];
    server?.events.on("request:start", ({ request }) => {
      if (new URL(request.url).pathname.endsWith("/affiliate_link/visit")) {
        seenPosts.push(request.method);
      }
    });

    const visit = useAffiliateLinkVisit().as(ScopeActorTypes.GUEST);
    const target = await visit.useActions().visit();

    // File slug `zero-redirects` (design.md §8.11): "status zero returns the
    // marked target. The status-zero case reddens: the result is not the
    // origin." design.md §8.12 "Visit fails, status zero, empty body: the
    // origin". `window.location.origin` is read independently here, at test
    // time, from the SAME browser global the composable's own default
    // `visitUrl` reads (design.md §5.2) — never a value copied back from the
    // composable's own result.
    expect(seenPosts).toHaveLength(1);
    expect(target).toBe(window.location.origin);
  });
});
