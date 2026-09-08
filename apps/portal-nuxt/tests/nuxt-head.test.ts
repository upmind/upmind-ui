// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { loadNuxtConfig, runPrepaint } from "./support/prepaint";
import { STORAGE_KEYS } from "./support/theme-harness";
import type { NuxtHeadScript, PrepaintRun } from "./support/prepaint";

const FONT_FAMILIES = [
  "@fontsource-variable/inter",
  "@fontsource-variable/jetbrains-mono",
  "@fontsource-variable/outfit",
  "@fontsource-variable/rethink-sans",
  "@fontsource-variable/sora",
  "@fontsource-variable/space-grotesk",
  "@fontsource-variable/bricolage-grotesque",
  "@fontsource/gilda-display",
  "@fontsource/instrument-serif"
];

let head: Awaited<ReturnType<typeof loadNuxtConfig>>["app"]["head"];
let css: string[];
let prepaint: NuxtHeadScript;
let defaultTheme: string;

beforeAll(async () => {
  const config = await loadNuxtConfig();
  head = config.app.head;
  css = config.css;
  const scripts = head.script ?? [];
  expect(scripts).toHaveLength(1);
  prepaint = scripts[0];
  defaultTheme = head.htmlAttrs?.["data-theme"] ?? "";
});

describe("served head — shell defaults", () => {
  it("defaults <html> to the upmind brand in English", () => {
    expect(head.htmlAttrs).toMatchObject({
      lang: "en",
      "data-theme": "upmind"
    });
  });

  it("carries the portal title, description and svg favicon", () => {
    expect(head.title).toMatch(/Upmind Portal/);
    expect(head.meta).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "description" })])
    );
    expect(head.link).toEqual(
      expect.arrayContaining([
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }
      ])
    );
  });

  it("loads the nine self-hosted font families before the app stylesheet", () => {
    expect(css).toEqual([...FONT_FAMILIES, "~/main.css"]);
  });

  it("places the theme script in the head, not deferred to the body", () => {
    expect(prepaint.innerHTML).toBeTruthy();
    expect(prepaint.body).toBeUndefined();
    expect(prepaint.tagPosition).toBeUndefined();
  });
});

describe("served head — pre-paint theme restore", () => {
  const run = (overrides: Omit<PrepaintRun, "script" | "defaultTheme">) =>
    runPrepaint({
      script: prepaint.innerHTML ?? "",
      defaultTheme,
      ...overrides
    });

  it("restores a stored brand onto <html> before paint", () => {
    const result = run({ storage: { [STORAGE_KEYS.theme]: "verdant" } });

    expect(result.theme).toBe("verdant");
    expect(result.errors).toEqual([]);
  });

  it("keeps the served default when no brand is stored", () => {
    expect(run({}).theme).toBe(defaultTheme);
  });

  it("restores dark mode from the stored mode", () => {
    const result = run({
      storage: { [STORAGE_KEYS.mode]: "dark" },
      prefersDark: false
    });

    expect(result.isDarkClass).toBe(true);
  });

  it("honours a stored light mode over an OS dark preference", () => {
    const result = run({
      storage: { [STORAGE_KEYS.mode]: "light" },
      prefersDark: true
    });

    expect(result.isDarkClass).toBe(false);
  });

  it("follows the OS preference when no mode is stored", () => {
    expect(run({ prefersDark: true }).isDarkClass).toBe(true);
    expect(run({ prefersDark: false }).isDarkClass).toBe(false);
  });

  it("restores brand and mode together", () => {
    const result = run({
      storage: { [STORAGE_KEYS.theme]: "aurora", [STORAGE_KEYS.mode]: "dark" }
    });

    expect(result).toMatchObject({ theme: "aurora", isDarkClass: true });
  });

  it("keeps the served defaults when storage access throws", () => {
    const result = run({ breakStorage: true, prefersDark: true });

    expect(result).toMatchObject({ theme: defaultTheme, isDarkClass: false });
    expect(result.errors).toEqual([]);
  });
});
