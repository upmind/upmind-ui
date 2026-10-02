// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/self-drawn-binding.spec
 * @description The OPT-IN, graded from both sides — that a self-drawn page can
 * now bind a composable for booting, and that a self-drawn page which does NOT
 * is exactly where it always was.
 *
 * ## Job To Be Done
 * `registry.ts` builds `boundKeys` — the keys the harness can build a boot thunk
 * for — from the two renderer bindings, and its own comment states the
 * consequence: "a self-drawn module binds no collection and no editor, so there
 * is no thunk to build for it and asking for one throws". FE-3226 adds a THIRD
 * member, `useManage`, for a page that boots the module itself and merely draws
 * it by hand.
 *
 * The hazard that buys is obvious: an additive member on a shared registry can
 * quietly move every other declaration that was excluded by the same filter.
 * Eight directories draw their own page; FOUR of them opt in (`useTicket`,
 * `useContract`, `useContractProduct`, `useInvoice`). The other four —
 * `usePaymentDetailAdd`, `overlay-pay`, `overlay-payment` and `overlay-upgrade`
 * — must be untouched in all three respects: out of the registry the harness
 * boots from, unbootable through the world, and still declaring no `tracks`. A
 * page that opts in owes the converse: a playlist the corpus seam reaches, every
 * track of it armable.
 *
 * So this reads the LIVE registry rather than a list: a ninth self-drawn page
 * landing tomorrow is inside this verdict the moment it lands, and the named set
 * below is the assertion that today's four are exactly today's four.
 *
 * ## What Breaks If These Fail
 * Either the opt-in does not work (the manager's bar has nothing to boot and
 * every manager scenario is unplayable again), or it works too widely: a page
 * that binds nothing acquires a thunk over `undefined`, and the throw that used
 * to say so plainly becomes a page that boots something it never declared.
 */

import { describe, expect, it } from "vitest";
import { useFeatureTracks } from "../runtime/composables/useFeatureTracks";
import { useScenarioWorld } from "../runtime/composables/useScenarioWorld";
import { featureTracksFor } from "../runtime/force/corpus.source";
import { registry, scenarioRegistry } from "../runtime/registry";
import { excludedTagsOf, trackedModuleOf } from "../runtime/scenario.utils";
import { CONTRACT_SCENARIO } from "../useContract/contract.scenario";
import { CONTRACT_PRODUCT_SCENARIO } from "../useContractProduct/contract-product.scenario";
import { INVOICE_SCENARIO } from "../useInvoice/invoice.scenario";
import { TICKET_SCENARIO } from "../useTicket/ticket.scenario";
import {
  every,
  filter,
  includes,
  isEmpty,
  keys,
  map,
  reject,
  sortBy,
  values
} from "lodash-es";
import type { ScenarioKey } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** Every declaration that draws its own page — neither renderer binding named. */
const selfDrawnKeys = (): ScenarioKey[] =>
  filter(
    keys(registry),
    key => !registry[key].useList && !registry[key].useMutate
  );

/** Of those, the ones that opted in for booting. */
const boundSelfDrawnKeys = (): ScenarioKey[] =>
  filter(selfDrawnKeys(), key => !!registry[key].useManage);

/** Of those, the ones that did NOT opt in. Today's three. */
const unboundKeys = (): ScenarioKey[] =>
  filter(selfDrawnKeys(), key => !registry[key].useManage);

/**
 * The four by ROUTE — the directory each declaration was found in, which is what
 * a reader recognises them by. Named so the set itself is falsifiable: an opt-in
 * that leaked onto one of these fails here before it can fail anywhere subtler.
 */
const UNBOUND_ROUTES = [
  "overlay-pay",
  "overlay-payment",
  "overlay-upgrade",
  "usePaymentDetailAdd"
];

// -----------------------------------------------------------------------------

describe("a self-drawn page binds nothing — unless it says otherwise", () => {
  it("finds the manager among the self-drawn pages, opted in", () => {
    expect(includes(selfDrawnKeys(), TICKET_SCENARIO)).toBe(true);
    expect(registry[TICKET_SCENARIO].useManage).toBeTypeOf("function");
  });

  it("builds a boot thunk for the key that opted in", () => {
    // The whole point: `World.boot("ticket", …)` has something to call.
    expect(includes(keys(scenarioRegistry), TICKET_SCENARIO)).toBe(true);
    expect(scenarioRegistry[TICKET_SCENARIO]).toBeTypeOf("function");
  });

  it("finds the four that opted in, by key", () => {
    expect(sortBy(boundSelfDrawnKeys())).toStrictEqual(
      sortBy([
        TICKET_SCENARIO,
        CONTRACT_SCENARIO,
        CONTRACT_PRODUCT_SCENARIO,
        INVOICE_SCENARIO
      ])
    );
  });

  it("leaves every other self-drawn page exactly where it was — the four, by name", () => {
    expect(
      sortBy(map(unboundKeys(), key => registry[key].route))
    ).toStrictEqual(UNBOUND_ROUTES);
  });

  it("keeps all four out of the registry the harness boots from", () => {
    expect(
      filter(unboundKeys(), key => includes(keys(scenarioRegistry), key))
    ).toStrictEqual([]);
  });

  it("keeps all four declaring no playlist, so their bar is Live-only as before", () => {
    expect(filter(unboundKeys(), key => !!registry[key].tracks)).toStrictEqual(
      []
    );
  });

  it("still THROWS when the world is asked to boot one of the four", async () => {
    // `registry.ts`'s own sentence, still true: "there is no thunk to build for
    // it and asking for one throws". A narrowed binding map is handed in so the
    // refusal is the BINDING's, never a missing key.
    const world = useScenarioWorld(registry);

    for (const key of unboundKeys())
      await expect(world.boot(key, { actor: "client" })).rejects.toBeInstanceOf(
        Error
      );
  });

  it("boots the four that opted in without throwing at the binding", () => {
    // Read off the registry rather than called: enumerating must instantiate no
    // scope (`scenario.types.ts` — a declaration names the BUILDER). What is
    // graded here is that the thunk closes over a real composable, which is the
    // exact absence the four above still carry.
    const bound = values(
      filter(keys(scenarioRegistry), key =>
        includes(
          [
            TICKET_SCENARIO,
            CONTRACT_SCENARIO,
            CONTRACT_PRODUCT_SCENARIO,
            INVOICE_SCENARIO
          ],
          key
        )
      )
    );

    expect(sortBy(bound)).toStrictEqual(
      sortBy([
        TICKET_SCENARIO,
        CONTRACT_SCENARIO,
        CONTRACT_PRODUCT_SCENARIO,
        INVOICE_SCENARIO
      ])
    );
    expect(registry[CONTRACT_PRODUCT_SCENARIO].useList).toBeUndefined();
    expect(registry[CONTRACT_PRODUCT_SCENARIO].useMutate).toBeUndefined();
    expect(registry[TICKET_SCENARIO].useList).toBeUndefined();
    expect(registry[TICKET_SCENARIO].useMutate).toBeUndefined();
    expect(registry[INVOICE_SCENARIO].useList).toBeUndefined();
    expect(registry[INVOICE_SCENARIO].useMutate).toBeUndefined();
  });

  it("gives every page that opted in a playlist the corpus seam reaches", () => {
    const unreached = reject(boundSelfDrawnKeys(), key => {
      const module = trackedModuleOf(registry[key].tracks);
      return !!module && !!featureTracksFor(module);
    });

    expect(unreached).toStrictEqual([]);
  });

  it("lets every page that opted in arm every track it lists that is not `@todo`", () => {
    for (const key of boundSelfDrawnKeys()) {
      const { tracks } = registry[key];
      const source = featureTracksFor(trackedModuleOf(tracks) ?? "");
      const { tracks: playlist } = useFeatureTracks({
        feature: source?.feature ?? "",
        catalog: source?.catalog ?? {},
        without: excludedTagsOf(tracks)
      });

      expect(isEmpty(playlist), key).toBe(false);
      expect(
        map(
          filter(
            playlist,
            track => !track.isPlayable && !includes(track.tags, "@todo")
          ),
          track => track.name
        ),
        key
      ).toStrictEqual([]);
      expect(
        every(playlist, track => !isEmpty(track.scenes)),
        key
      ).toBe(true);
    }
  });
});
