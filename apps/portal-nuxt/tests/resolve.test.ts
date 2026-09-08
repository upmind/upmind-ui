import { describe, expect, it } from "vitest";
import type { PortalConfig, PrimitivesConfig } from "~/portal/types";
import { moduleGroup, moduleRef } from "~/portal/registry";
import { resolve } from "~/portal/resolve";
import { PRIMITIVE_ID } from "~/portal/types";

/** bdd.md B1/B2 are written against the pure resolver — resolve() is what a
 * later stage's shell renders and logs from, so "rejected"/"module"/"group"
 * here stands in for "renders"/"is empty and errors loudly". */
function configWith(primitives: PrimitivesConfig): PortalConfig {
  return { primitives, content: {}, groups: [], customAreas: [] };
}

describe("resolve — B1: the config is the only place chrome is declared", () => {
  it("a primitive removed from the config disappears from the resolved shell", () => {
    const withSidebar = configWith({
      [PRIMITIVE_ID.TOPBAR]: { primitive: PRIMITIVE_ID.TOPBAR, slots: {} },
      [PRIMITIVE_ID.SIDEBAR]: {
        primitive: PRIMITIVE_ID.SIDEBAR,
        slots: { middle: moduleRef("fixture-marker") }
      }
    });
    const withoutSidebar = configWith({
      [PRIMITIVE_ID.TOPBAR]: { primitive: PRIMITIVE_ID.TOPBAR, slots: {} }
    });

    expect(resolve(withSidebar).primitives.sidebar).toBeDefined();
    expect(resolve(withoutSidebar).primitives.sidebar).toBeUndefined();
    // its neighbour is untouched by the removal
    expect(resolve(withoutSidebar).primitives.topbar).toBeDefined();
  });

  it("an unknown module id is rejected, naming the id and the slot", () => {
    const config = configWith({
      [PRIMITIVE_ID.SIDEBAR]: {
        primitive: PRIMITIVE_ID.SIDEBAR,
        slots: { middle: { kind: "module", id: "not-a-real-module" } }
      }
    });

    const slot = resolve(config).primitives.sidebar?.slots.middle;

    expect(slot?.status).toBe("rejected");
    if (slot?.status === "rejected") {
      expect(slot.reason).toContain("not-a-real-module");
      expect(slot.reason).toContain("sidebar.middle");
    }
  });

  it("an unknown primitive id renders nothing rather than throwing (tasks.md 2.0 F4)", () => {
    // `PrimitiveId` is a closed union at the type level, but design.md §D3
    // notes the type is a parse step away from any serialised config source
    // — `JSON.parse` stands in for that untyped boundary, the same way a
    // config not authored through `PortalConfig` could arrive at runtime.
    // §D5 requires the same "loud in dev, quiet in prod" treatment an
    // unregistered MODULE id gets, never a `TypeError` from an unguarded
    // `PRIMITIVES[primitiveId]` lookup.
    const primitives = JSON.parse(
      JSON.stringify({
        "not-a-real-primitive": {
          primitive: "not-a-real-primitive",
          slots: { default: { kind: "module", id: "fixture-marker" } }
        }
      })
    );
    const config = configWith(primitives);

    let resolved: ReturnType<typeof resolve> | undefined;
    expect(() => {
      resolved = resolve(config);
    }).not.toThrow();

    const [resolvedPrimitive] = Object.values(resolved?.primitives ?? {});
    expect(resolvedPrimitive?.slots.default?.status).toBe("rejected");
  });

  it("mirrors the rejection above: the same registered id resolves to a module in a slot that accepts its tag", () => {
    const config = configWith({
      [PRIMITIVE_ID.UTILITY]: {
        primitive: PRIMITIVE_ID.UTILITY,
        slots: { top: moduleRef("fixture-marker") }
      }
    });

    const slot = resolve(config).primitives.utility?.slots.top;

    expect(slot?.status).toBe("module");
  });
});

describe("resolve — B2: slot acceptance is enforced at the seam", () => {
  it("rejects a content-tagged module at topbar.left, naming the slot and the tag", () => {
    const config = configWith({
      [PRIMITIVE_ID.TOPBAR]: {
        primitive: PRIMITIVE_ID.TOPBAR,
        slots: { left: moduleRef("fixture-marker") }
      }
    });

    const slot = resolve(config).primitives.topbar?.slots.left;

    expect(slot?.status).toBe("rejected");
    if (slot?.status === "rejected") {
      expect(slot.reason).toContain("topbar.left");
      expect(slot.reason).toContain("content");
    }
  });

  it("the same module rejected above is legal in utility.botmid, which accepts content", () => {
    const config = configWith({
      [PRIMITIVE_ID.UTILITY]: {
        primitive: PRIMITIVE_ID.UTILITY,
        slots: { botmid: moduleRef("fixture-marker") }
      }
    });

    const slot = resolve(config).primitives.utility?.slots.botmid;

    expect(slot?.status).toBe("module");
    if (slot?.status === "module") expect(slot.id).toBe("fixture-marker");
  });

  it("a group is admitted at a slot unconditionally, but its member is rejected against that HOST slot's own accept list (design.md §D4 second half)", () => {
    // `bottom.default` only accepts `nav` (primitives.ts) — `fixture-marker`
    // carries `content` — so the GROUP is not the thing rejected here (board
    // rule 2 / §D6: a group is universal), its member is. Re-pointed from
    // "a module group is rejected at a slot that does not accept the group
    // tag" (tasks.md 2.0 F2): that assertion named the wrong half — the old
    // resolver gated the whole group on an `ACCEPT_TAG.GROUP` entry that no
    // longer exists on any row, and asserting flat `rejected` here now
    // asserts the exact regression §D4 was rewritten to prevent. The
    // `members[0].status === "rejected"` half is load-bearing (tasks.md 2.0
    // F7): it is the only assertion in the suite that would notice member
    // checking being ripped out of resolve.ts entirely — `status === "group"`
    // alone still passes under that mutation.
    const group = moduleGroup("horizontal", [moduleRef("fixture-marker")]);
    const config = configWith({
      [PRIMITIVE_ID.BOTTOM]: {
        primitive: PRIMITIVE_ID.BOTTOM,
        slots: { default: group }
      }
    });

    const slot = resolve(config).primitives.bottom?.slots.default;

    expect(slot?.status).toBe("group");
    if (slot?.status === "group") {
      expect(slot.members).toHaveLength(1);
      expect(slot.members[0]?.status).toBe("rejected");
    }
  });

  it("the same group rejected above renders in a slot that accepts a group", () => {
    const group = moduleGroup("horizontal", [moduleRef("fixture-marker")]);
    const config = configWith({
      [PRIMITIVE_ID.UTILITY]: {
        primitive: PRIMITIVE_ID.UTILITY,
        slots: { top: group }
      }
    });

    const slot = resolve(config).primitives.utility?.slots.top;

    expect(slot?.status).toBe("group");
    if (slot?.status === "group") {
      expect(slot.axis).toBe("horizontal");
      expect(slot.members).toHaveLength(1);
      expect(slot.members[0]?.status).toBe("module");
    }
  });
});

describe("resolve — the route's area override replaces a primitive wholesale (design.md §D8)", () => {
  const base = configWith({
    [PRIMITIVE_ID.SIDEBAR]: {
      primitive: PRIMITIVE_ID.SIDEBAR,
      variant: "default",
      slots: { middle: moduleRef("fixture-marker") }
    }
  });

  it("with no route, the base config's primitive stands", () => {
    expect(resolve(base).primitives.sidebar).toBeDefined();
  });

  it("an override of `false` removes the primitive the base declared", () => {
    const resolved = resolve(base, {
      area: { [PRIMITIVE_ID.SIDEBAR]: false }
    });

    expect(resolved.primitives.sidebar).toBeUndefined();
  });

  it("a present override replaces the base entry wholesale, not merged", () => {
    const resolved = resolve(base, {
      area: {
        [PRIMITIVE_ID.SIDEBAR]: {
          primitive: PRIMITIVE_ID.SIDEBAR,
          variant: "hidden",
          slots: {}
        }
      }
    });

    expect(resolved.primitives.sidebar?.variant).toBe("hidden");
    expect(resolved.primitives.sidebar?.slots.middle).toBeUndefined();
  });
});
