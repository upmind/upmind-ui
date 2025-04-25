import { useEffect } from "@storybook/preview-api";
import { DecoratorHelpers } from "@storybook/addon-themes";
import { reduce, set } from "lodash-es";

const { initializeThemeState, pluckThemeFromContext } = DecoratorHelpers;

export const withUpmindUITheme = ({
  themes,
  defaultTheme = "light",
  locales,
  defaultLocale = "en",
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

  return (story, context) => {
    const selectedTheme = pluckThemeFromContext(context);
    const { themeOverride } = context.parameters.themes ?? {};
    const selected = themeOverride || selectedTheme || defaultTheme;

    const locale = context.globals.locale || defaultLocale;

    useEffect(() => {
      // TODO: deprecate this in favour of a more robust solution
      // where the selected theme is applied to the template's theme provider
      // see https://github.com/storybookjs/storybook/issues/12840
      const parentElement = document.querySelector("#provider");
      parentElement?.setAttribute("data-theme", selected);
      parentElement?.setAttribute("data-locale", locale);
    }, [themeOverride, selected, locale]);

    return {
      components: { story },
      template: `
        <div id="provider" data-theme="${selected}" data-locale="${locale}" class="content bg-background p-4 sm:p-8 text-foreground prose max-w-full min-h-screen">
          <story />
        </div>`,
    };
  };
};
