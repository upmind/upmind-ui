// --- external
import WebFontLoader from "webfontloader";

// --- internal
import {
  utils,
  type Theme,
  type ThemeTokens
} from "@upmind-automation/headless";

// --- utils
const { useImageUrl } = utils;
import {
  kebabCase,
  forEach,
  isString,
  set,
  last,
  dropRight,
  join,
  has,
  startCase,
  isEmpty,
  uniq,
  compact
} from "lodash-es";
import type { IImage } from "../../../../types/src";

// import { IBrandMetaToken } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

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
  const cssVars = Object.entries(tokens)
    .map(([k, v]) => `${k}: ${v};`)
    .join("\n");

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

function mapTokens(
  obj: any,
  path: string[] = [],
  result: Record<string, string> = {}
) {
  forEach(obj, (value, key) => {
    const newPath = [...path, kebabCase(key)];

    if (isString(value)) {
      const cssKey = join(
        last(newPath) === "default" ? dropRight(newPath) : newPath,
        "-"
      );
      result[`--${cssKey}`] = value;
    } else {
      mapTokens(value, newPath, result);
    }
  });

  return result;
}

// ---

export function setTokens(theme: Theme) {
  if (!theme) return;

  const stylesheet = ensureStylesheet("upmind-design-tokens");
  const cssVars = mapTokens(theme.tokens);
  setCssRules(stylesheet, `[data-theme='${theme.id}']`, cssVars);
}

export function setDocumentTitle(brandName?: string) {
  if (!brandName) return;
  document.title = `Checkout | ${brandName}`;

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

export function setFontFamily(fonts?: ThemeTokens["fonts"]) {
  const families = uniq(compact([fonts?.sans, fonts?.body, fonts?.display]));

  //
  const stylesheet = ensureStylesheet("upmind-design-tokens");

  if (!isEmpty(families)) {
    const familiesWithWeights = families.map(family => `${family}:400,500,600`);

    WebFontLoader.load({
      google: { families: familiesWithWeights },
      active: () => {
        const cssVars: Record<string, string> = {};

        forEach(fonts, (family, key) => {
          if (!family) return;
          cssVars[`--font-${key}`] =
            `"${family}", ui-sans-serif, system-ui, sans-serif`;
        });

        setCssRules(stylesheet, ":root", cssVars);
      }
    });
  }
}
