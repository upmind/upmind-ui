import "../stories/assets/main.css";
import { useArgs } from "@storybook/preview-api";
import { setup } from "@storybook/vue3";
import { createI18n } from "vue-i18n";
import upmindUI from "../plugins/upmind-ui";
import themes from "../stories/assets/themes";
import OverviewTemplate from "./OverviewTemplate.mdx";
import { withUpmindUITheme } from "./withUpmindUITheme.decorator";
import { reduce, last, merge } from "lodash-es";
import type { Preview } from "@storybook/vue3";
// -----------------------------------------------------------------------------

setup(app => {
  function getGlobalMessages() {
    const messages = reduce(
      import.meta.glob("@locales/**/*.json", { eager: true }),
      (result, value, key) => {
        const locale = last(key.split("/"))?.replace(".json", "");
        if (!locale) return result;
        merge(result, { [locale]: value?.default || {} });
        return result;
      },
      {}
    );

    return messages;
  }

  const i18n = createI18n({
    legacy: false,
    locale: "en",
    fallbackLocale: "en",
    messages: getGlobalMessages(),
    // ---
    missingWarn: false,
    fallbackWarn: false,
    silentTranslationWarn: true,
    silentFallbackWarn: true
  });
  app.use(i18n);

  app.use(upmindUI);
});

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    toolbar: {
      zoom: { hidden: true },
      // eject: { hidden: true },
      copy: { hidden: true }
      // fullscreen: { hidden: true },
    },
    controls: { exclude: ["uiConfig"] },
    docs: {
      page: OverviewTemplate,
      story: {
        inline: false
      }
    },
    options: {
      storySort: {
        order: [
          "Introduction",
          "Components",
          ["Overview", "Variations", "Accessibility", "Base"],
          ["Accordion", ["Overview", "Variations", "Accessibility", "Base"]]
        ]
      }
    },
    defaultPath: "/docs/introduction--page"
  },

  globalTypes: {
    locale: {
      description: "Internationalization locale",
      defaultValue: "en",
      toolbar: {
        title: "Locale",
        icon: "globe",
        dynamicTitle: true,
        items: [
          { value: "en", right: "🇬🇧", title: "English" },
          { value: "fr", right: "🇫🇷", title: "French" },
          { value: "es", right: "🇪🇸", title: "Spanish" },
          { value: "de", right: "🇩🇪", title: "German" },
          { value: "it", right: "🇮🇹", title: "Italian" },
          { value: "pt", right: "🇵🇹", title: "Portuguese" },
          { value: "ru", right: "🇷🇺", title: "Russian" }
        ]
      }
    }
  },

  decorators: [
    withUpmindUITheme({
      themes,
      defaultTheme: "light",
      locales: [],
      defaultLocale: "en"
    }),
    (story, context) => {
      // This make sit possible to updateArgs within stories
      const [_, updateArgs] = useArgs();
      return story({ ...context, updateArgs });
    }
  ]

  // tags: ["autodocs"],
};

export default preview;
