import { useEffect, useRef } from "@storybook/preview-api";
import { ref } from "vue";
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

  return (storyFn, context) => {
    const selectedTheme = pluckThemeFromContext(context);
    const { themeOverride } = useThemeParameters();

    const selected = ref(themeOverride || selectedTheme || defaultTheme);

    console.log("upwind theme changed", selected, context);

    useEffect(() => {
      // const parentElement = document.querySelector("html");
      // parentElement?.setAttribute("data-theme", selected);
    }, [themeOverride, selected]);

    return {
      components: { story },
      template: `
      <upw-theme-provider theme="${selected.value}">
        <div class="content bg-base p-4 sm:p-8 text-base-content prose max-w-full min-h-screen">
            <story />
        </div>
      </upw-theme-provider>`,
    };
  };
};
