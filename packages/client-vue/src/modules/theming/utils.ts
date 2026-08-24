import WebFontLoader from "webfontloader";
import {
  useImageUrl,
  type Theme,
  type ThemeTokens
} from "@upmind-automation/headless";
import { defineTheme, themeToCss } from "@upmind/tokens";
import {
  forEach,
  has,
  isEmpty,
  uniq,
  compact,
  isString,
  map,
  find
} from "lodash-es";
import type { IImage } from "@upmind-automation/types";

// import { IBrandMetaToken } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const injectedTokens = new Set<string>();

function ensureStylesheet(id: string) {
  let styleEl = document.getElementById(id) as HTMLStyleElement;

  if (!styleEl) {
    styleEl = document.createElement("style") as HTMLStyleElement;
    styleEl.setAttribute("id", id);
    document.head.appendChild(styleEl);
  }

  return styleEl;
}

function setCssRules(
  el: HTMLStyleElement,
  selector: string,
  tokens: Record<string, string>,
  reset: boolean = false
) {
  const cssVars = map(tokens, (v, k) => `${k}: ${v};`).join("\n");

  // Remove previous rules if any
  if (el.sheet && reset) {
    while (el.sheet.cssRules.length > 0) {
      el.sheet.deleteRule(0);
    }
  }

  const cssRule = `${selector} {\n${cssVars}\n}`;

  el.textContent += "\n";
  el.textContent += cssRule;
}

// ---

export function setTokens(theme: Theme) {
  if (!theme?.tokens) return;

  let themeCSS = theme.tokens;

  // Transform theme-scoped selectors to work with root theme variables
  // Without this transformation, we can't use root theme vars in combination with our base theme
  // Converts [data-theme="dark"] { --color: #000 } to :root:has([data-theme="dark"]) { --color: #000 }
  // - :root targets the document root where global CSS variables live
  // - :has([data-theme="dark"]) only applies when the DOM contains data-theme="dark"
  // - This creates a CSS cascade where dark theme variables override base theme
  // - Without this, theme variables would be scoped only to the themed element
  if (isString(themeCSS) && themeCSS.includes("[data-theme=")) {
    // Dark block first: the engine emits `[data-theme].dark, ...` selector lists;
    // hoist them to the root the same way so html-level consumers flip too (the
    // light rewrite below would otherwise outrank them from :root in dark mode).
    themeCSS = themeCSS.replace(
      /\[data-theme="([^"]+)"\]\.dark[^{]*{/g,
      ':root.dark:has([data-theme="$1"]) {'
    );
    themeCSS = themeCSS.replace(
      /\[data-theme="([^"]+)"\]\s*{/g,
      ':root:has([data-theme="$1"]) {'
    );
  }

  // Appending is order-sensitive: the derived brand palette goes in first and
  // the BE's explicit tokens after, so they win. Re-appending an already-injected
  // block (a remount, HMR) would put it last and invert that, so inject once.
  if (injectedTokens.has(themeCSS)) return;
  injectedTokens.add(themeCSS);

  const stylesheet = ensureStylesheet("upmind-design-tokens");
  stylesheet.textContent += "\n" + themeCSS;
}

/**
 * Derive a full brand theme from a single brand hex (FE-2888 Phase 5). The OKLCH
 * engine generates the whole light+dark, WCAG-nudged palette from the one anchor
 * and emits it as a `[data-theme="<id>"]` block — so a brand that ships only a
 * `brand_color` no longer needs a stored token string; it's produced at runtime
 * and layered over the base via the cascade (`setTokens` injects it like any
 * theme). Returns a `Theme` for the registry.
 */
const HEX_COLOR = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function deriveBrandTheme(opts: {
  id: string;
  name: string;
  primary: string;
  font?: string;
}): Theme | undefined {
  // A malformed BE hex would ride NaN through the OKLCH engine into every token.
  const hasValidBrandHex = HEX_COLOR.test(opts.primary);
  if (!hasValidBrandHex) {
    console.warn(
      `[theming] invalid brand_color "${opts.primary}" — keeping the base theme`
    );
    return undefined;
  }

  const resolved = defineTheme({
    name: opts.id,
    label: opts.name,
    // The engine decouples `control` (form-control accent) from `primary`, so a
    // primary-only brand leaves checkboxes/radios/switches/inputs on the base
    // neutral. The cart drives form controls from the brand too, so anchor
    // `control` on the same hex (FE-2888 — brand colour on every component).
    colors: { primary: opts.primary, control: opts.primary },
    fonts: opts.font ? { display: opts.font } : undefined
  });

  return {
    id: opts.id,
    name: opts.name,
    tokens: themeToCss(resolved, { scope: "data" })
  };
}

export function setDocumentTitle(brandName?: string) {
  if (!brandName) return;

  const preserveTitle = document.querySelector(
    "meta[name='upmind-preserve-title'][content='true']"
  );

  if (!preserveTitle) {
    document.title = `Checkout | ${brandName}`;
  }

  const meta = document.querySelector(
    "meta[name='apple-mobile-web-app-title']"
  );

  if (meta) {
    meta.setAttribute("content", brandName);
  } else {
    const newMeta = document.createElement("meta");
    newMeta.setAttribute("name", "apple-mobile-web-app-title");
    newMeta.setAttribute("content", brandName);
    document.head.appendChild(newMeta);
  }
}

export function setDocumentFavicon(brandFavicon?: IImage | null) {
  if (!brandFavicon) return;

  const types: Record<string, { type?: string; sizes?: (string | null)[] }> = {
    icon: {
      type: "image/png",
      sizes: ["32x32", "16x16", "96x96", "192x192"]
    },
    "icon svg": {
      type: "image/svg+xml",
      sizes: [null]
    },
    "apple-touch-icon": {
      sizes: ["180x180"]
    }
  };

  forEach(types, (icon, type) => {
    const pattern = [`link`];
    if (has(icon, "type")) pattern.push(`[type='${icon.type}']`);
    forEach(icon?.sizes, size => {
      if (size) pattern.push(`[sizes='${size}']`);
      const query = pattern.join("");
      let link = document.querySelector(query);
      if (!link) {
        link = document.createElement("link");

        link!.setAttribute("rel", type);

        if (icon?.type) link!.setAttribute("type", icon!.type as string);

        if (size) link!.setAttribute("sizes", size);

        document.head.insertAdjacentHTML("beforeend", link.outerHTML);
      }

      const url = useImageUrl(brandFavicon.full_url!, size ?? "");
      if (url) link.setAttribute("href", url);
    });
  });
}

/**
 * Fetches and injects a custom font stylesheet, returning the extracted font family name.
 * Uses a single request to both load the stylesheet and parse the font family.
 */
export async function setDisplayFontLink(url: string): Promise<string | null> {
  const id = "upmind-display-font";

  const response = await fetch(url).catch(() => null);
  if (!response?.ok) return null;

  const css = await response.text();

  // Inject the CSS as a style element
  let style = document.getElementById(id) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = id;
    document.head.appendChild(style);
  }
  style.textContent = css;

  // Extract font family from the loaded stylesheet
  const sheet = style.sheet;
  if (!sheet) return null;

  const fontFaceRule = find(
    sheet.cssRules,
    rule => rule instanceof CSSFontFaceRule
  ) as CSSFontFaceRule | undefined;

  const fontFamily = fontFaceRule?.style.getPropertyValue("font-family");
  return fontFamily ? fontFamily.replace(/['"]/g, "").trim() : null;
}

export function setFontVariables(fonts?: ThemeTokens["fonts"]) {
  const stylesheet = ensureStylesheet("upmind-design-tokens");
  const cssVars: Record<string, string> = {};

  forEach(fonts, (family, key) => {
    if (!family) return;
    cssVars[`--font-${key}`] =
      `"${family}", ui-sans-serif, system-ui, sans-serif`;
  });

  setCssRules(stylesheet, ":root", cssVars);
}

export async function loadGoogleFonts(
  fonts?: ThemeTokens["fonts"]
): Promise<void> {
  const families = uniq(compact([fonts?.sans, fonts?.body, fonts?.display]));

  return new Promise<void>((resolve, _reject) => {
    if (isEmpty(families)) return resolve();

    const familiesWithWeights = map(
      families,
      family => `${family}:400,500,600,700,800`
    );

    WebFontLoader.load({
      google: { families: familiesWithWeights },
      active: () => {
        return resolve();
      }
    });
  });
}
