// --- external
import WebFontLoader from "webfontloader";

// --- internal
import theme from "../../assets/themes/light/tailwind.config";
import uiConfig from "../../assets/themes/light/ui.config";

// --- utils
import {
  kebabCase,
  forEach,
  isString,
  set,
  last,
  dropRight,
  join
} from "lodash-es";

// import { IBrandMetaToken } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export const loadFont = (fontFamily: string) => {
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

export const createTheme = (name: string, token: any /*IBrandMetaToken*/) => {
  applyToken(token);

  return {
    name,
    id: name,
    extend: theme,
    uiConfig
  };
};
