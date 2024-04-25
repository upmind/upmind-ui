import { useEffect } from "@storybook/preview-api";
import { DecoratorHelpers } from "@storybook/addon-themes";
import { reduce, set } from "lodash-es";

const { initializeThemeState, pluckThemeFromContext, useThemeParameters } =
  DecoratorHelpers;

export const withUpwindTheme = ({ themes, defaultTheme }) => {
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
    const { themeOverride } = useThemeParameters();
    const selected = themeOverride || selectedTheme || defaultTheme;

    useEffect(() => {
      // TODO: deprecate this in favour of a more robust solution
      // where the selected theme is applied to the template's theme provider
      // see https://github.com/storybookjs/storybook/issues/12840
      const parentElement = document.querySelector("#theme-provider");
      parentElement?.setAttribute("data-theme", selected);
    }, [themeOverride, selected]);

    return {
      components: { story },
      template: `
      <upw-theme-provider theme="${selected}">
        <div class="content bg-base p-4 sm:p-8 text-base-content prose max-w-full min-h-screen">
            <story />
        </div>
      </upw-theme-provider>`,
    };
  };
};
