import { join, dirname } from "path";
import remarkGfm from "remark-gfm";
import type { StorybookConfig } from "@storybook/vue3-vite";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],

  staticDirs: ["../public"],

  addons: [
    "@storybook/addon-links",
    {
      name: "@storybook/addon-essentials",
      options: {
        backgrounds: false,
        measure: false,
        outline: false
      }
    },
    "@chromatic-com/storybook",
    "@storybook/addon-interactions",
    "@storybook/addon-themes",
    "@storybook/components",
    "storybook-addon-vue-mdx",
    {
      name: "@storybook/addon-docs",
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm]
          }
        }
      }
    }
  ],

  framework: {
    name: getAbsolutePath("@storybook/vue3-vite"),
    options: {}
  },

  viteFinal: async config => {
    const { mergeConfig } = await import("vite");
    const tailwindcss = await import("@tailwindcss/vite");

    return mergeConfig(config, {
      plugins: [tailwindcss.default()]
    });
  },

  docs: {
    autodocs: true,
    defaultName: "Overview"
  }
};
export default config;
