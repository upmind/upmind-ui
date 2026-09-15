// -----------------------------------------------------------------------------
/**
 * @module components/scope/__tests__/guest-brand-validity.spec
 * @description FE-3087 (operator ruling §22 B5) — a pooled guest is not a brand.
 *
 * ## Job To Be Done
 * `allSessions` now carries guests, and a guest never has a `/self` profile to
 * carry a brand. This proves the selector still treats brand membership as a
 * client/staff question: a brand change never hands the tab to a guest, and a
 * guest left in the pool does not make the tab's brand look still-valid after
 * the last signed-in session goes.
 *
 * ## What Breaks If These Fail
 * Choosing a brand silently switches the user to an anonymous guest and opts
 * that tab out of the remote-login upgrade; and logging out the last session
 * that belonged to the brand leaves the user sitting on a brand nothing in the
 * pool belongs to, because the guest answered "valid" on its behalf.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { defineComponent, h } from "vue";
import { AccessRoleTypes } from "@upmind-automation/types";
import {
  seedPool,
  benchOn,
  flush,
  headlessDouble,
  resetDom,
  CLIENT_EMAILS_ROUTE
} from "./harness";
import { map, startsWith } from "lodash-es";
import type { Router } from "vue-router";

vi.mock("@upmind-automation/headless", async () =>
  headlessDouble(await vi.importActual("@upmind-automation/headless"))
);

// -----------------------------------------------------------------------------

const HOME_BRAND = "brand-x";
const OTHER_BRAND = "brand-y";

/** One signed-in client on the home brand, and a guest nobody chose beside it. */
const POOL = [
  {
    id: "client-x",
    actor: AccessRoleTypes.CLIENT,
    publicName: "Client X",
    brandId: HOME_BRAND
  },
  { id: "guest-a", actor: AccessRoleTypes.GUEST }
];

/** The same brand-scoped client, with two guests this device holds. */
const TWO_GUEST_POOL = [
  ...POOL,
  { id: "guest-b", actor: AccessRoleTypes.GUEST }
];

const brandPath = (brand: string) =>
  `/${brand}/${CLIENT_EMAILS_ROUTE}/as/client`;

type Selector = Awaited<
  ReturnType<typeof import("../useActorScopeSelector").useActorScopeSelector>
>;

/**
 * Mounts the selector on a branded scope path and hands back its live surface
 * together with the router the page is on.
 *
 * @param brand - The brand segment the url carries.
 * @returns The composable and the router driving it.
 */
async function selectorOnBrand(
  brand: string
): Promise<{ selector: Selector; router: Router }> {
  const { useActorScopeSelector } = await import("../useActorScopeSelector");
  let selector: Selector | undefined;

  const Host = defineComponent({
    setup() {
      selector = useActorScopeSelector();
      return () => h("div");
    }
  });

  const bench = await benchOn(Host, brandPath(brand));
  return { selector: selector as Selector, router: bench.router };
}

/** The store pointer, read off the same published context the app reads. */
async function pointer(): Promise<{ actor: string; id?: string }> {
  const { useSessionStore } = await import("@upmind-automation/headless");
  const { activeActor, activeSessionId } = useSessionStore().useContext();
  return { actor: activeActor.value, id: activeSessionId.value };
}

describe("B5 a pooled guest is not a brand", () => {
  afterEach(() => {
    resetDom();
  });

  // The first bench boot in a file transforms the whole scope module graph.
  it(
    "a brand change never activates the pooled guest @AC-G33",
    { timeout: 20000 },
    async () => {
      seedPool(POOL, { active: "client-x" });

      const { selector, router } = await selectorOnBrand(HOME_BRAND);
      expect(selector.currentBrandId.value).toBe(HOME_BRAND);

      await router.push(brandPath(OTHER_BRAND));
      await flush();

      // The brand the selector watches really moved, so the re-activation it
      // guards ran — and still found nothing it was willing to activate.
      expect(selector.currentBrandId.value).toBe(OTHER_BRAND);
      expect(await pointer()).toEqual({
        actor: AccessRoleTypes.CLIENT,
        id: "client-x"
      });
    }
  );

  it("in brand mode both pooled guests are listed and one is switchable by id @AC-G36", async () => {
    seedPool(TWO_GUEST_POOL, { active: "client-x" });

    const { selector } = await selectorOnBrand(HOME_BRAND);
    expect(selector.currentBrandId.value).toBe(HOME_BRAND);

    // Brand membership is a client/staff question, so a guest answers "not
    // valid for this brand" — which is why the row lists must not consult it.
    expect(map(selector.guestItems.value, "id")).toEqual([
      "guest-a",
      "guest-b"
    ]);
    expect(map(selector.sessionItems.value, "id")).toEqual(
      expect.arrayContaining(["client-x", "guest-a", "guest-b"])
    );

    await selector.switchSession(AccessRoleTypes.GUEST, "guest-b");
    await flush();

    expect(await pointer()).toEqual({
      actor: AccessRoleTypes.GUEST,
      id: "guest-b"
    });
  });

  it("logging out the last brand-valid client redirects org-wide even though a guest is pooled @AC-G34", async () => {
    seedPool(POOL, { active: "client-x" });

    const { selector, router } = await selectorOnBrand(HOME_BRAND);

    selector.logoutSession(AccessRoleTypes.CLIENT, "client-x");
    await flush();

    expect(router.currentRoute.value.params.brandIdOrOrg).not.toBe(HOME_BRAND);
    expect(
      startsWith(router.currentRoute.value.fullPath, `/${HOME_BRAND}/`)
    ).toBe(false);
  });
});
