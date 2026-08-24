import type { Preview } from "@storybook/vue3-vite";
import { themes } from "@upmind/tokens";
import {
  GLOBALS_UPDATED,
  SET_GLOBALS,
  UPDATE_GLOBALS
} from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";

import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/outfit";
import "@fontsource-variable/rethink-sans";
import "@fontsource-variable/sora";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/gilda-display";
import "@fontsource/instrument-serif";
import "../src/styles.css";

import { UpmindDocsContainer } from "./upmind-docs-container.ts";

/**
 * The toolbar list is derived from the tokens `themes` export — a new brand
 * added to design-system/packages/tokens (e.g. aurora) appears here with no Storybook work.
 */
const THEMES = themes.map(t => ({ value: t.name, title: t.label }));

const prefersDark =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : undefined;

/** Last globals applied to <html>/<body> (also covers docs-only pages). */
const applied = { theme: "upmind", mode: "light" };

/**
 * Mirror the toolbar globals onto the preview document: brand attribute,
 * mode class and the branded canvas wash (bg-canvas-gradient semantics —
 * body background-image from --canvas/--canvas-stop plus min-height, flat
 * when a theme keeps canvas-stop equal to canvas).
 */
function applyBrand(globals?: Record<string, unknown>): void {
  if (typeof document === "undefined") return;
  if (globals) {
    if (typeof globals["theme"] === "string") applied.theme = globals["theme"];
    if (typeof globals["mode"] === "string") applied.mode = globals["mode"];
  }
  const dark =
    applied.mode === "dark" ||
    (applied.mode === "system" && prefersDark?.matches === true);
  const root = document.documentElement;
  if (root.dataset["theme"] !== applied.theme)
    root.dataset["theme"] = applied.theme;
  if (root.classList.contains("dark") !== dark)
    root.classList.toggle("dark", dark);
  const body = document.body.style;
  body.backgroundColor = "var(--canvas)";
  body.backgroundImage =
    "linear-gradient(to bottom, var(--canvas), var(--canvas-stop))";
  body.minHeight = "100dvh";
}

if (typeof window !== "undefined") {
  const channel = addons.getChannel();
  channel.on(
    SET_GLOBALS,
    ({ globals }: { globals: Record<string, unknown> }) => {
      applyBrand(globals);
    }
  );
  channel.on(
    GLOBALS_UPDATED,
    ({ globals }: { globals: Record<string, unknown> }) => {
      const nextTheme =
        typeof globals["theme"] === "string" ? globals["theme"] : applied.theme;
      if (nextTheme !== applied.theme) {
        // Honor the brand's preferredMode on brand switch (aurora is dark-first).
        // Only at the moment of the switch — an explicit Mode change afterwards
        // wins until the next brand switch.
        const preferred = themes.find(t => t.name === nextTheme)?.preferredMode;
        if (preferred && globals["mode"] !== preferred) {
          applyBrand({ ...globals, mode: preferred });
          channel.emit(UPDATE_GLOBALS, { globals: { mode: preferred } });
          return;
        }
      }
      applyBrand(globals);
    }
  );
  // System mode tracks the OS preference live.
  prefersDark?.addEventListener("change", () => {
    if (applied.mode === "system") applyBrand();
  });
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Upmind UI brand theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: THEMES,
        dynamicTitle: true
      }
    },
    mode: {
      description: "Color mode",
      toolbar: {
        title: "Mode",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "system", title: "System" }
        ],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: {
    theme: "upmind",
    mode: "light"
  },
  decorators: [
    (story, context) => {
      // Synchronous safety net so the brand is applied before the story
      // paints (the channel listeners above cover docs-only pages).
      applyBrand(context.globals);
      return {
        components: { story },
        template: '<div class="font-sans text-body"><story /></div>'
      };
    }
  ],
  parameters: {
    layout: "centered",
    backgrounds: { disable: true },
    docs: {
      toc: true,
      container: UpmindDocsContainer
    },
    a11y: {
      test: "error"
    },
    options: {
      storySort: {
        order: [
          "Welcome",
          "Foundations",
          [
            "Colors",
            "Typography",
            "Spacing & Density",
            "Radius & Shape",
            "Elevation",
            "Motion",
            "States",
            "Iconography"
          ],
          "Theming",
          "Actions",
          "Forms",
          "Display",
          "Feedback",
          "Navigation",
          "Overlay",
          "Layout",
          "Typography"
        ]
      }
    }
  }
};

export default preview;
