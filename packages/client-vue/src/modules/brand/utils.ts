// --- external
import WebFontLoader from "webfontloader";

// --- internal
import { utils } from "@upmind-automation/headless";
import theme from "../../assets/themes/light/tailwind.config";
import uiConfig from "../../assets/themes/light/ui.config";

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
  isEmpty
} from "lodash-es";
import type { IImage } from "../../../../types/src";

// import { IBrandMetaToken } from "@upmind-automation/headless";
// -----------------------------------------------------------------------------

const applyToken = (token: any /*IBrandMetaToken*/) => {
  const variables: Record<string, string> = {};

  const flatten = (obj: any, path: string[] = []) => {
    forEach(obj, (value, key) => {
      const newPath = [...path, kebabCase(key)];

      if (isString(value)) {
        const key = join(
          last(newPath) === "default" ? dropRight(newPath) : newPath,
          "-"
        );
        set(variables, key, value);
      } else {
        flatten(value, newPath);
      }
    });
  };

  flatten(token);

  forEach(variables, (value, key) => {
    document.documentElement.style.setProperty(`--${key}`, value);
  });
};

// -----------------------------------------------------------------------------

export function setBrandTitle(brandName?: string) {
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

export function setBrandFavicon(brandFavicon?: IImage) {
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

export const setBrandFontFamily = (fontFamily: string) => {
  if (!fontFamily) return;

  WebFontLoader.load({
    google: {
      families: [fontFamily]
    },
    active: () => {
      document.documentElement.style.setProperty(
        "--fontFamily",
        `"${fontFamily}", ui-sans-serif, system-ui, sans-serif`
      );
    },
    inactive: () => {
      document.documentElement.style.setProperty(
        "--fontFamily",
        "ui-sans-serif, system-ui, sans-serif"
      );
    }
  });
};

export const setBrandTheme = (name: string, token: any /*IBrandMetaToken*/) => {
  applyToken(token);

  return {
    name,
    id: name,
    extend: theme,
    uiConfig
  };
};
