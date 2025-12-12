import { useEffect } from "@storybook/preview-api";
import { DecoratorHelpers } from "@storybook/addon-themes";
import { reduce, set, includes } from "lodash-es";

const { initializeThemeState, pluckThemeFromContext } = DecoratorHelpers;

export const withUpmindUITheme = ({
  themes,
  defaultTheme = "light",
  locales,
  defaultLocale = "en"
}) => {
  const themeNames = reduce(
    themes,
    (acc, { id }) => {
      set(acc, id, id);
      return acc;
    },
    {}
  );

  initializeThemeState(Object.keys(themeNames), defaultTheme);

  const applyThemeTokens = themeId => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme?.tokens) return;

    let themeCSS = theme.tokens;
    if (includes(themeCSS, "[data-theme=")) {
      themeCSS = themeCSS?.replace(
        /\[data-theme="([^"]+)"\]\s*{/,
        ':root:has([data-theme="$1"]) {'
      );
    }

    const stylesheet = ensureStylesheet("upmind-design-tokens");
    stylesheet.textContent += "\n" + (themeCSS ?? "");
  };

  return (story, context) => {
    const getTheme = () => {
      if (context.globals.theme && context.globals.theme !== "")
        return context.globals.theme;

      const addonTheme = pluckThemeFromContext(context);
      if (addonTheme) return addonTheme;

      const checkUrl = url => {
        const match =
          url.match(/theme[:%]3A([^&]+)/) || url.match(/theme:([^&]+)/);
        return match ? match[1] : null;
      };

      const currentUrl = window.location.search;
      const urlTheme = checkUrl(currentUrl);
      if (urlTheme) return urlTheme;

      if (window.parent !== window) {
        const parentUrl = window.parent.location.search;
        const parentTheme = checkUrl(parentUrl);
        if (parentTheme) return parentTheme;
      }

      return defaultTheme;
    };

    const selected = context.parameters.themes?.themeOverride || getTheme();
    const locale = context.globals.locale || defaultLocale;

    useEffect(() => {
      const parentElement = document.querySelector("#provider");
      parentElement?.setAttribute("data-theme", selected);
      parentElement?.setAttribute("data-locale", locale);

      // Apply theme tokens as CSS custom properties
      applyThemeTokens(selected);
    }, [selected, locale]);

    return {
      components: { story },
      template: `
        <div id="provider" data-theme="${selected}" data-locale="${locale}" class="bg-surface sm:p-8 text-base max-w-full min-h-screen">
          <story />
        </div>`
    };
  };

  function ensureStylesheet(id) {
    let styleEl = document.getElementById(id);

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.setAttribute("id", id);
      document.head.appendChild(styleEl);
    }

    return styleEl;
  }
};
