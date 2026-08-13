// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC1.1 @AC1.5 @AC9.1 @F6 @D9 the brand segment is a DESIGNED
 * menu of the brands the app knows, never a pasted id (T2.2).
 *
 * ## Job To Be Done
 * "Which brand is this page scoped to, and what else could it be?" must be
 * answerable by opening one control and reading it. That means two things a
 * list alone does not give: the brands come from what the app already knows,
 * and the one you are on is MARKED — otherwise the menu is the id popover with
 * extra steps.
 *
 * ## What is NOT claimed here
 * That the brand menu re-boots the module — the scope path is the router's, and
 * the page's own remount on a scope change is `P1-R2`'s, proven where the page
 * is. This spec follows the navigation only as far as the url it lands on.
 *
 * ## What Breaks If These Fail
 * A developer reads the menu and cannot tell where they are; or a brand switch
 * silently drops the surface state (`view`·`track`·`scene`·`sheet`·`tab`·
 * `force`) off the link they were about to send a colleague.
 */

import { describe, expect, it, afterEach, beforeEach, vi } from "vitest";
import { AccessRoleTypes } from "@upmind-automation/types";
import { DropdownMenu } from "@upmind-automation/upmind-ui";
import { filter, find, map } from "lodash-es";
import type { Bench } from "./harness";
import type { DropdownMenuItemProps } from "@upmind-automation/upmind-ui";

vi.mock("@upmind-automation/headless", async importOriginal => {
  const real = (await importOriginal()) as object;
  const { headlessDouble } = await import("./harness");
  return headlessDouble(real);
});

const {
  HOST_BRAND,
  benchOn,
  flush,
  labs,
  node,
  openPanel,
  resetDom,
  seedPool
} = await import("./harness");
const BrandSegment = (await import("../BrandSegment.vue")).default;

// -----------------------------------------------------------------------------

const ORG = "org";

const SURFACE_QUERY =
  "view=table&track=a-client-sees-their-email-collection&scene=3&sheet=scenario&tab=gherkin&force=empty";

const AT_ORG = "/useClientEmails/as/client";
const AT_BRAND = `/${HOST_BRAND.id}/useClientEmails/as/client`;

const items = (bench: Bench): DropdownMenuItemProps[] =>
  (bench.wrapper.findComponent(DropdownMenu).props("items") ??
    []) as DropdownMenuItemProps[];

const marked = (bench: Bench): string[] =>
  map(
    filter(items(bench), item => item.icon === "check"),
    "value"
  );

const choose = async (value: string): Promise<void> => {
  const item = find(
    Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-test-key='brand-segment-item']"
      )
    ),
    candidate => candidate.dataset.testValue === value
  );
  item
    ?.closest("[role='menuitem']")
    ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await flush();
};

let bench: Bench;

beforeEach(() => {
  seedPool([{ id: "c1", actor: AccessRoleTypes.CLIENT }], { active: "c1" });
});

afterEach(() => {
  bench?.wrapper.unmount();
  resetDom();
});

// -----------------------------------------------------------------------------

describe("@AC1.1 @F6 opening it offers the brands the app knows", () => {
  it("lists org-wide alongside the host brand, each from the catalogue or the brand's own name", async () => {
    bench = await benchOn(BrandSegment, AT_ORG);
    await openPanel("brand-segment");

    expect(map(items(bench), "value")).toEqual([ORG, HOST_BRAND.id]);
    expect(map(items(bench), "label")).toEqual([
      labs("brand_org"),
      HOST_BRAND.name
    ]);
  });

  it("never asks for a pasted identifier", async () => {
    bench = await benchOn(BrandSegment, AT_ORG);
    await openPanel("brand-segment");

    expect(document.querySelectorAll("input")).toHaveLength(0);
    expect(document.querySelectorAll("[contenteditable]")).toHaveLength(0);
  });

  it("names the trigger from the catalogue rather than a template string", async () => {
    bench = await benchOn(BrandSegment, AT_ORG);
    const panel = await openPanel("brand-segment");

    expect(node("brand-segment")?.textContent).toContain(labs("brand_org"));
    expect(panel.textContent).toContain(labs("brand_menu"));
  });
});

describe("@AC1.1 @AC1.5 the scope you are AT is marked, and only it", () => {
  it("marks org-wide while the url carries no brand", async () => {
    bench = await benchOn(BrandSegment, AT_ORG);
    await openPanel("brand-segment");

    expect(marked(bench)).toEqual([ORG]);
  });

  it("moves the mark onto the host brand when the url carries it", async () => {
    bench = await benchOn(BrandSegment, AT_BRAND);
    await openPanel("brand-segment");

    expect(marked(bench)).toEqual([HOST_BRAND.id]);
  });
});

describe("@AC9.1 a brand switch carries the surface state with it", () => {
  it("lands on the chosen brand's scope path", async () => {
    bench = await benchOn(BrandSegment, AT_ORG);
    await openPanel("brand-segment");

    await choose(HOST_BRAND.id);

    expect(bench.router.currentRoute.value.path).toContain(
      `/${HOST_BRAND.id}/useClientEmails`
    );
  });

  it("keeps every surface param the url was carrying", async () => {
    bench = await benchOn(BrandSegment, `${AT_ORG}?${SURFACE_QUERY}`);
    await openPanel("brand-segment");

    await choose(HOST_BRAND.id);

    expect(bench.router.currentRoute.value.query).toEqual({
      view: "table",
      track: "a-client-sees-their-email-collection",
      scene: "3",
      sheet: "scenario",
      tab: "gherkin",
      force: "empty"
    });
  });
});
