/**
 * Dark-aware, brand-aware addon-docs container.
 *
 * The preview applies the toolbar globals to <html> (`data-theme` + `.dark`);
 * this container observes those attributes and rebuilds the docs-page theme
 * from the active brand's resolved token set, so autodocs pages follow the
 * Mode and Theme toolbars exactly like story canvases do.
 */
import {
  DocsContainer,
  type DocsContainerProps
} from "@storybook/addon-docs/blocks";
import { themes, type ResolvedTheme } from "@upmind/tokens";
import * as React from "react";
import { create } from "storybook/theming";

export const UPMIND_UI_BRAND_TITLE = "Upmind UI";
export const UPMIND_UI_BRAND_URL = "https://upmind.com";
export const UPMIND_UI_FONT_BASE =
  "'Inter Variable', 'Inter', system-ui, sans-serif";
export const UPMIND_UI_FONT_CODE =
  "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, 'SF Mono', monospace";

function brandFor(name: string): ResolvedTheme {
  const brand = themes.find(t => t.name === name) ?? themes[0];
  if (!brand) throw new Error("@upmind/tokens shipped no themes");
  return brand;
}

/** Storybook (emotion) theme derived from a brand's resolved token records. */
function docsTheme(themeName: string, dark: boolean) {
  const tokens = dark ? brandFor(themeName).dark : brandFor(themeName).light;
  const pick = (token: string, fallback: string) => tokens[token] ?? fallback;
  return create({
    base: dark ? "dark" : "light",
    brandTitle: UPMIND_UI_BRAND_TITLE,
    brandUrl: UPMIND_UI_BRAND_URL,
    fontBase: UPMIND_UI_FONT_BASE,
    fontCode: UPMIND_UI_FONT_CODE,
    colorPrimary: pick("primary", "#26262B"),
    colorSecondary: pick("promo", "#8757F1"),
    appBg: pick("canvas", dark ? "#0E0E12" : "#F9F9FC"),
    appContentBg: pick("canvas", dark ? "#0E0E12" : "#F9F9FC"),
    appPreviewBg: pick("surface", dark ? "#17171B" : "#FFFFFF"),
    appBorderColor: pick("stroke", dark ? "#2D2D32" : "#EAEAF1"),
    appBorderRadius: 8,
    textColor: pick("body", dark ? "#D3D3DC" : "#3E3E44"),
    textMutedColor: pick("muted", dark ? "#858591" : "#6B6B76"),
    barBg: pick("surface", dark ? "#17171B" : "#FFFFFF"),
    barTextColor: pick("muted", dark ? "#858591" : "#6B6B76"),
    barSelectedColor: pick("primary", dark ? "#E7E7EB" : "#26262B"),
    barHoverColor: pick("promo", "#8757F1"),
    inputBg: pick("surface", dark ? "#17171B" : "#FFFFFF"),
    inputBorder: pick("stroke", dark ? "#2D2D32" : "#EAEAF1"),
    inputTextColor: pick("body", dark ? "#D3D3DC" : "#3E3E44")
  });
}

function readHtmlState(): { theme: string; dark: boolean } {
  if (typeof document === "undefined") return { theme: "upmind", dark: false };
  const root = document.documentElement;
  return {
    theme: root.dataset["theme"] ?? "upmind",
    dark: root.classList.contains("dark")
  };
}

export function UpmindDocsContainer(
  props: React.PropsWithChildren<DocsContainerProps>
): React.ReactElement {
  const [state, setState] = React.useState(readHtmlState);
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const next = readHtmlState();
      setState(prev =>
        prev.theme === next.theme && prev.dark === next.dark ? prev : next
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"]
    });
    return () => observer.disconnect();
  }, []);
  return React.createElement(DocsContainer, {
    ...props,
    theme: docsTheme(state.theme, state.dark)
  });
}
