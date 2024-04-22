import "../stories/assets/main.css";
import { Preview, Renderer } from "@storybook/your-renderer";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { provide, ref } from "vue";
import themes from "@/assets/themes";
import { reduce, find, set } from "lodash-es";

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    layout: "fullscreen",
  },
  decorators: [
    withThemeByDataAttribute<Renderer>({
      themes: reduce(
        themes,
        (acc, { id }) => {
          set(acc, id, id);
          return acc;
        },
        {}
      ),
      defaultTheme: "light",
      attributeName: "data-theme",
    }),

    (story, context) => {
      // const activeTheme = ref(context.globals.theme);
      // const theme = find(themes, ["id", activeTheme.value]);
      // const upwindStyles = ref(theme?.upwind || {});

      // provide("activeTheme", activeTheme);
      // provide("upwind", upwindStyles);

      return {
        components: { story },
        template: `
          <div class="content bg-base p-4 sm:p-8 text-base-content prose max-w-full min-h-screen">
            <story />
          </div>
        `,
      };
    },
  ],
};

export default preview;
