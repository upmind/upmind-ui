import { mount, flushPromises } from "@vue/test-utils";
import {
  ArrowLeft,
  CircleCheck,
  CircleCheckBig,
  CircleQuestionMark,
  Delete,
  LoaderCircle,
  Timer,
  TriangleAlert,
  X
} from "lucide-vue-next";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FALLBACK_ICON, ICON_MAP, resolveLucideIcon } from "./icon-map";
import Icon from "./Icon.vue";
import { registerIcons, setIconVariant } from "./iconLoader";

// The static `icon="…"` names in use across client-vue (grep-enumerated).
// Guards that every shipped name stays mapped — a deleted entry fails here.
const STATIC_NAMES = [
  "alert-octagon",
  "alert-triangle",
  "arrow-left",
  "arrow-right",
  "building-07",
  "check-circle",
  "check-circle-broken",
  "clock-fast-forward",
  "clock-stopwatch",
  "delete",
  "edit-01",
  "file-attachment-01",
  "info-circle",
  "internet",
  "list",
  "loading-01",
  "lock-01",
  "mail-01",
  "plus",
  "plus-circle",
  "search",
  "search-md",
  "arrow-up",
  "arrow-down",
  "alert-circle",
  "switch-horizontal-02",
  "search-refraction",
  "settings-04",
  "shopping-bag-02",
  "shopping-cart-01",
  "switch-horizontal-01",
  "tag-02",
  "translate-01",
  "trash-02",
  "user-01",
  "user-03",
  "user-circle",
  "user-plus-01",
  "x-close"
];

describe("resolveLucideIcon", () => {
  it("maps every static Untitled-UI name in use to a lucide component", () => {
    for (const name of STATIC_NAMES) {
      expect(resolveLucideIcon(name), `"${name}" must be mapped`).toBeDefined();
    }
  });

  it("resolves the lucide v1 renames to the correct component", () => {
    // Locks the 0.x→1.x audit: these all moved names in lucide v1.
    expect(resolveLucideIcon("alert-triangle")).toBe(TriangleAlert);
    expect(resolveLucideIcon("check-circle")).toBe(CircleCheck);
    expect(resolveLucideIcon("check-circle-broken")).toBe(CircleCheckBig);
    expect(resolveLucideIcon("loading-01")).toBe(LoaderCircle);
    expect(resolveLucideIcon("x-close")).toBe(X);
    expect(resolveLucideIcon("arrow-left")).toBe(ArrowLeft);
    expect(resolveLucideIcon("clock-stopwatch")).toBe(Timer);
    expect(resolveLucideIcon("delete")).toBe(Delete);
  });

  it("returns undefined for unmapped names so the SVG/fallback path takes over", () => {
    expect(resolveLucideIcon("gb")).toBeUndefined(); // country flag → asset SVG
    expect(resolveLucideIcon("totally-unknown-glyph")).toBeUndefined();
    expect(resolveLucideIcon("")).toBeUndefined();
    expect(resolveLucideIcon(undefined)).toBeUndefined();
  });

  it("exposes a help glyph as the visible fallback", () => {
    expect(FALLBACK_ICON).toBe(CircleQuestionMark);
  });

  it("keeps the map free of accidental duplicate-key drift", () => {
    // Both user variants intentionally collapse onto lucide User.
    expect(ICON_MAP["user-01"]).toBe(ICON_MAP["user-03"]);
  });
});

describe("Icon.vue", () => {
  it("renders a mapped lucide glyph as an <svg>", () => {
    const wrapper = mount(Icon, { props: { icon: "x-close" } });
    const svg = wrapper.find("svg");
    expect(svg.exists()).toBe(true);
    expect(svg.attributes("aria-label")).toBe("x-close icon");
    expect(svg.attributes("role")).toBe("img");
  });

  it("applies the size scale to the rendered glyph", () => {
    const wrapper = mount(Icon, { props: { icon: "arrow-left", size: "sm" } });
    expect(wrapper.find("svg").classes()).toContain("size-5");
  });

  it("falls back to a visible glyph (never blank) for an unmapped, unregistered name", () => {
    const wrapper = mount(Icon, { props: { icon: "totally-unknown-glyph" } });
    // Asset loader is unregistered in the test → fallback help glyph renders.
    expect(wrapper.find("svg").exists()).toBe(true);
  });

  it("prefers the `fallback` name when the primary is unmapped", () => {
    const wrapper = mount(Icon, {
      props: { icon: "totally-unknown-glyph", fallback: "dot" }
    });
    expect(wrapper.find("svg").exists()).toBe(true);
  });
});

describe("brand icon packs", () => {
  const pack = (variant: string, name: string, body: string) => [
    `/icons/packs/${variant}/${name}.svg`,
    () => Promise.resolve(body)
  ];

  beforeEach(() => {
    registerIcons(
      Object.fromEntries([
        pack("Line", "alert-triangle", '<svg data-pack="Line"></svg>'),
        pack("Solid", "alert-triangle", '<svg data-pack="Solid"></svg>')
      ]) as never
    );
  });

  afterEach(() => {
    registerIcons({});
    setIconVariant("");
  });

  it("serves a registered pack asset in place of the lucide map", async () => {
    setIconVariant("Line");
    const wrapper = mount(Icon, { props: { icon: "alert-triangle" } });
    await flushPromises();
    // the <i v-html> asset branch, not the lucide <svg> component branch
    expect(wrapper.find("i").html()).toContain('data-pack="Line"');
  });

  it("follows the brand when the active pack changes", async () => {
    setIconVariant("Solid");
    const wrapper = mount(Icon, { props: { icon: "alert-triangle" } });
    await flushPromises();
    expect(wrapper.find("i").html()).toContain('data-pack="Solid"');
  });

  it("still uses the lucide map for names no pack provides", async () => {
    setIconVariant("Line");
    const wrapper = mount(Icon, { props: { icon: "x-close" } });
    await flushPromises();
    expect(wrapper.find("svg").exists()).toBe(true);
    expect(wrapper.find("i").exists()).toBe(false);
  });

  it("uses the lucide map when a host registers no assets at all", async () => {
    registerIcons({});
    setIconVariant("Line");
    const wrapper = mount(Icon, { props: { icon: "alert-triangle" } });
    await flushPromises();
    expect(wrapper.find("svg").exists()).toBe(true);
  });
});
