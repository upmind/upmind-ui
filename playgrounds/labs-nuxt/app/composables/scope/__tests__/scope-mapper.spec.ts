// @vitest-environment jsdom
// -----------------------------------------------------------------------------
/**
 * @module composables/scope/__tests__/scope-mapper.spec
 * @description The scope address a playground page carries in its url, for a
 * context that names a catalogue rather than an entity.
 *
 * ## Job To Be Done
 * Three pure string functions own the whole address: `buildScopePath` writes
 * it, `parseScopeSuffix` reads it back, `stripScopeSuffix` removes it. A
 * catalogue context has no entity, so the address has one segment where it used
 * to have two — and all three have to agree about that, in both directions,
 * without disturbing the two-segment form every existing page already uses.
 *
 * ## What Breaks If These Fail
 * The page addresses `/for/invoice/undefined` and boots a scope keyed on the
 * string "undefined"; or the reader refuses a legitimate catalogue address as
 * malformed, so the capability is unreachable from the playground; or the
 * stripper leaves half an address behind and the page cannot navigate away.
 *
 * ## No `@anchor`, on purpose
 * AC-7 has no scenario to anchor to. A scope address is an internal identifier,
 * and the scenario that once described it promised page-reopen behaviour these
 * three pure functions never reach — withdrawn for exactly that reason
 * (`docs/sdd/FE-3239/bdd.md` §Deferred, row 4). Claiming an id the feature does
 * not declare is what both traceability gates fail on, so this file carries
 * none and sits outside their reach. A rename therefore drops it silently:
 * that is the cost of the deferral, stated rather than left to be discovered.
 */

import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { buildScopePath, parseScopeSuffix, stripScopeSuffix } from "..";

// -----------------------------------------------------------------------------

const PAGE = "useClientCustomFields";

describe("a catalogue scope address", () => {
  it("writes the catalogue with no entity segment", () => {
    const path = buildScopePath({
      page: PAGE,
      actor: ScopeActorTypes.CLIENT,
      context: { type: "invoice" }
    });

    expect(path).toBe(`/${PAGE}/as/${ScopeActorTypes.CLIENT}/for/invoice`);
    expect(path).not.toMatch(/undefined/);
  });

  it("reads a catalogue address back as a context with no entity", () => {
    const parsed = parseScopeSuffix(`as/${ScopeActorTypes.CLIENT}/for/invoice`);

    expect(parsed.valid).toBe(true);
    expect(parsed.actor).toBe(ScopeActorTypes.CLIENT);
    expect(parsed.context?.type).toBe("invoice");
    expect(parsed.context?.id).toBeUndefined();
  });

  it("round-trips a catalogue scope through the url and back", () => {
    const context = { type: "cancel_request" };
    const path = buildScopePath({
      page: PAGE,
      actor: ScopeActorTypes.CLIENT,
      context
    });
    const suffix = path.replace(`/${PAGE}/`, "");

    expect(parseScopeSuffix(suffix).context).toEqual(context);
  });

  it("removes a catalogue address whole, leaving the page behind", () => {
    expect(
      stripScopeSuffix(`/${PAGE}/as/${ScopeActorTypes.CLIENT}/for/invoice`)
    ).toBe(`/${PAGE}`);
  });

  it("still refuses an address that names no context type at all", () => {
    // Widening the grammar to accept a type alone must not widen it to accept
    // `/for/` with nothing after it — that names no context and can only be a
    // truncated url.
    expect(parseScopeSuffix(`as/${ScopeActorTypes.CLIENT}/for`).valid).toBe(
      false
    );
  });
});

// -----------------------------------------------------------------------------

describe("a retargeted scope address is untouched", () => {
  it("writes, reads and strips the two-segment form exactly as before", () => {
    // Hard-coded literals: these are the addresses the playground's existing
    // pages already link to and bookmark.
    const path = buildScopePath({
      page: PAGE,
      actor: ScopeActorTypes.CLIENT,
      context: { type: "client", id: "c-9" }
    });

    expect(path).toBe(`/${PAGE}/as/client/for/client/c-9`);

    const parsed = parseScopeSuffix("as/client/for/client/c-9");
    expect(parsed.valid).toBe(true);
    expect(parsed.context).toEqual({ type: "client", id: "c-9" });

    expect(stripScopeSuffix(`/${PAGE}/as/client/for/client/c-9`)).toBe(
      `/${PAGE}`
    );
  });

  it("keeps an actor-only address readable and strippable", () => {
    expect(parseScopeSuffix("as/client").context).toBeUndefined();
    expect(stripScopeSuffix(`/${PAGE}/as/client`)).toBe(`/${PAGE}`);
  });
});
