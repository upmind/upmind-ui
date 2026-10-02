import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Suspense, defineComponent, h } from "vue";

// jsdom rewrites import.meta.url to an http URL, so the app root comes from the vitest root instead.
const PAGES_DIR = resolve(import.meta.dirname ?? process.cwd(), "../app/pages");

/**
 * The client-area route tree (plan §1.2, Phase A): the five pillars with
 * their sub-routes and detail routes, plus the catch-all serving product
 * groups and custom areas. The named group pages (/websites, /services,
 * /domains) are retired — a group route resolves through the catch-all
 * against the active config's groups. The logged-out screens (plan F11, and
 * F5's two token screens plus the org registration) sit at the top level,
 * each under a reserved pillar segment. The delegate invitation's landing
 * (plan F18 O-1) sits beside them: it is reached by the link's own hash
 * rather than by a session.
 */
const EXPECTED_ROUTES = [
  "/",
  "*",
  "/delegate-access/accept/:hash",
  "/forgotten-password",
  "/login",
  "/logout",
  "/preferences",
  "/preferences/email/opt-ins",
  "/register",
  "/register-org",
  "/reset-password",
  "/verify",
  "/verify-email",
  "/account",
  "/account/affiliate",
  "/account/child-accounts",
  "/account/child-accounts/:id",
  "/account/delegates",
  "/account/delegates/:id",
  "/account/logs",
  "/account/logs/emails/:id",
  "/account/notes",
  "/account/notifications",
  "/account/profile",
  "/account/security",
  "/billing",
  "/billing/credit",
  "/billing/credit-notes",
  "/billing/credit-notes/:id",
  "/billing/credit-notes/:id/print",
  "/billing/credit-statements/:id/print",
  "/billing/invoices",
  "/billing/invoices/:id",
  "/billing/invoices/:id/print",
  "/billing/orders",
  "/billing/orders/:oid",
  "/billing/payment-methods",
  "/billing/settings",
  "/support",
  "/support/tickets",
  "/support/tickets/:id",
  "/support/tickets/new"
];

/** Nuxt's pages/ convention over a nested tree: index.vue is its directory's route, [id].vue is :id, [...param].vue is the catch-all. A DIRECTORY named `[id]` is the same parameter — a detail route with children of its own is written that way. */
function segment(name: string): string {
  if (/^\[.+]$/.test(name)) return `:${name.slice(1, -1)}`;
  return name;
}

function collectRoutes(dir: string, prefix: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const routes: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      routes.push(
        ...collectRoutes(
          resolve(dir, entry.name),
          `${prefix}/${segment(entry.name)}`
        )
      );
      continue;
    }
    if (!entry.name.endsWith(".vue")) continue;
    const base = entry.name.replace(/\.vue$/, "");
    if (/^\[\.\.\..+]$/.test(base)) {
      routes.push("*");
    } else if (base === "index") {
      routes.push(prefix === "" ? "/" : prefix);
    } else if (/^\[.+]$/.test(base)) {
      routes.push(`${prefix}/:${base.slice(1, -1)}`);
    } else {
      routes.push(`${prefix}/${base}`);
    }
  }
  return routes;
}

const routes = collectRoutes(PAGES_DIR, "");

describe("file routing — AC1 route surface", () => {
  it("declares exactly the client-area route tree and nothing else", () => {
    expect([...routes].sort()).toEqual([...EXPECTED_ROUTES].sort());
  });

  it.each(EXPECTED_ROUTES)("serves %s from a page file", route => {
    expect(routes).toContain(route);
  });
});

describe("catch-all page — an unknown path says so, and offers the way back", () => {
  // A slug matching none of the active config's product groups or custom
  // areas — the resolveCatchAll "unmatched" branch this suite exercises.
  const UNMATCHED_SLUG = ["route-matching-nothing"];

  async function mountCatchAll(slug: readonly string[] = UNMATCHED_SLUG) {
    const navigateTo = vi.fn();
    const useRoute = () => ({ params: { slug }, path: `/${slug.join("/")}` });
    Object.assign(globalThis, {
      navigateTo,
      useRoute,
      // Nuxt's compile-time macro; the page calls it at setup.
      definePageMeta: () => undefined
    });

    const page = await import("~/pages/[...slug].vue");
    const host = defineComponent({
      render: () => h(Suspense, null, { default: () => h(page.default) })
    });
    const wrapper = mount(host);
    await flushPromises();

    return { wrapper, navigateTo };
  }

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "navigateTo");
    Reflect.deleteProperty(globalThis, "useRoute");
    Reflect.deleteProperty(globalThis, "definePageMeta");
  });

  it("renders the not-found page on setup", async () => {
    const { wrapper } = await mountCatchAll();

    expect(wrapper.text()).toContain("Page not found");
  });

  // The unknown path stays IN the address bar rather than being replaced by
  // the dashboard: a client who mistyped can see and correct what they typed.
  it("leaves the unknown path where it is instead of navigating away", async () => {
    const { navigateTo } = await mountCatchAll();

    expect(navigateTo).not.toHaveBeenCalled();
  });
});

describe("router.options — scroll behaviour", () => {
  it("restores a saved position and otherwise goes to the top", async () => {
    const options = await import("~/router.options");
    const scrollBehavior = options.default.scrollBehavior;

    expect(typeof scrollBehavior).toBe("function");
    expect(scrollBehavior({}, {}, { left: 0, top: 420 })).toEqual({
      left: 0,
      top: 420
    });
    expect(scrollBehavior({}, {}, null)).toEqual({ top: 0 });
  });
});
