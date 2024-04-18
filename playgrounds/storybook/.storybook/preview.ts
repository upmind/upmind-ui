import "../stories/assets/main.css";
import { Preview, Renderer } from "@storybook/your-renderer";
import { withThemeByDataAttribute } from "@storybook/addon-themes";

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute<Renderer>({
      themes: {
        light: "light",
        dark: "dark",
        retro: "retro",
      },
      defaultTheme: "light",
      attributeName: "data-theme",
    }),
    (story, context) => {
      return {
        components: { story },
        template: `
          <div class="content rounded-box bg-base px-4 text-base-content prose max-w-none min-h-screen">
            <story />
          </div>
        `,
      };
    },
  ],
};

export default preview;
