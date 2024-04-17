import "../assets/main.css";
import type { Preview } from "@storybook/vue3";

const preview: Preview = {
  // parameters: {
  //   controls: {
  //     matchers: {
  //       color: /(background|color)$/i,
  //       date: /Date$/i,
  //     },
  //   },
  // },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark", "retro", "elegant"],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const theme = context.globals.theme || "light";
      return {
        components: { story },
        template: `
          <div
            class="content rounded-box bg-base-200 px-4 text-base-content"
            data-theme="${theme}"
          >
            <story />
          </div>
        `,
      };
    },
  ],
};

export default preview;
