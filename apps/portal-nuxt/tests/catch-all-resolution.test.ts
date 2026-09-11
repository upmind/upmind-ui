import { describe, expect, it } from "vitest";
import type { PortalConfig } from "~/portal/types";
import {
  defineCustomArea,
  defineProductGroup,
  resolveCatchAll
} from "~/portal/routes";

/** design.md §D9's route tree, exercised as a pure function: resolveCatchAll
 * never touches the DOM, so its contract is provable without a mount. */
function configWith(
  groups: PortalConfig["groups"],
  customAreas: PortalConfig["customAreas"] = []
): PortalConfig {
  return { primitives: {}, content: {}, groups, customAreas };
}

const hosting = defineProductGroup({ slug: "hosting", label: "Hosting" });

describe("resolveCatchAll — AC1.4: the product hierarchy beneath a group", () => {
  const config = configWith([hosting]);

  it("no segments at all is unmatched", () => {
    expect(resolveCatchAll(config, [])).toEqual({ kind: "unmatched" });
  });

  it("a bare group slug resolves to its listing", () => {
    expect(resolveCatchAll(config, ["hosting"])).toEqual({
      kind: "group-listing",
      group: hosting
    });
  });

  it("group/order resolves to the contextual buy flow", () => {
    expect(resolveCatchAll(config, ["hosting", "order"])).toEqual({
      kind: "group-order",
      group: hosting
    });
  });

  it("group/id resolves to the product detail", () => {
    expect(resolveCatchAll(config, ["hosting", "pkg-1"])).toEqual({
      kind: "product-detail",
      group: hosting,
      id: "pkg-1"
    });
  });

  it("group/id/area resolves to the product action area", () => {
    expect(resolveCatchAll(config, ["hosting", "pkg-1", "billing"])).toEqual({
      kind: "product-action-area",
      group: hosting,
      id: "pkg-1",
      area: "billing"
    });
  });

  it("a slug matching no configured group is unmatched", () => {
    expect(resolveCatchAll(config, ["not-a-configured-group"])).toEqual({
      kind: "unmatched"
    });
  });
});

describe("resolveCatchAll — AC1.5: a configured Custom Area is a real destination", () => {
  const area = defineCustomArea({ slug: "loyalty", label: "Loyalty" });
  const config = configWith([hosting], [area]);

  it("resolves a configured custom area's slug", () => {
    expect(resolveCatchAll(config, ["loyalty"])).toEqual({
      kind: "custom-area",
      area
    });
  });

  it("mirrors the acceptance above: a path matching no route, group or custom area is unmatched", () => {
    expect(resolveCatchAll(config, ["nowhere"])).toEqual({ kind: "unmatched" });
  });
});

describe("resolveCatchAll — AC1.6: a product group's URL survives a label rename", () => {
  it("the same slug resolves to a listing whatever the group is labelled", () => {
    const before = configWith([
      defineProductGroup({ slug: "websites", label: "Websites" })
    ]);
    const after = configWith([
      defineProductGroup({ slug: "websites", label: "Sites" })
    ]);

    const beforeResolution = resolveCatchAll(before, ["websites"]);
    const afterResolution = resolveCatchAll(after, ["websites"]);

    expect(beforeResolution.kind).toBe("group-listing");
    expect(afterResolution.kind).toBe("group-listing");
    if (
      beforeResolution.kind === "group-listing" &&
      afterResolution.kind === "group-listing"
    ) {
      expect(beforeResolution.group.slug).toBe(afterResolution.group.slug);
      expect(beforeResolution.group.label).not.toBe(
        afterResolution.group.label
      );
    }
  });
});
