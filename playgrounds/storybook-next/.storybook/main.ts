import type { StorybookConfig } from "@storybook/vue3-vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import type { PluginOption } from "vite";

// Upmind badge (coral rounded square + white mark), matching the docs favicon.
import { UPMIND_BADGE_FAVICON } from "./upmind-badge.ts";

const config: StorybookConfig = {
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(ts|tsx)",
    "../../../design-system/packages/ui/src/**/*.stories.@(ts|tsx)"
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-vitest"
  ],
  framework: "@storybook/vue3-vite",
  core: {
    disableTelemetry: true
  },
  managerHead: head =>
    `${head}\n<link rel="icon" type="image/svg+xml" href="${UPMIND_BADGE_FAVICON}" />`,
  viteFinal: viteConfig => {
    // PREPEND the vue plugin: Storybook's docgen plugin appends __docgenInfo
    // to *.vue modules, so the SFC compiler must run before it — mergeConfig
    // would append and feed the compiler docgen-polluted source.
    const existing = (viteConfig.plugins ?? []) as PluginOption[];
    const flatten = (items: unknown[]): unknown[] =>
      items.flatMap(p => (Array.isArray(p) ? flatten(p) : [p]));
    const hasVue = flatten(existing).some(
      p => !!p && typeof p === "object" && "name" in p && p.name === "vite:vue"
    );
    viteConfig.plugins = [
      tailwindcss(),
      ...(hasVue ? [] : [vue()]),
      ...existing
    ];
    return viteConfig;
  }
};

export default config;
