// --- styles
import "../stories/assets/main.css";

// --- external
import { setup } from "@storybook/vue3";
import { withUpwindTheme } from "./withUpwindTheme.decorator";
import { useArgs } from "@storybook/preview-api";
import { createI18n } from "vue-i18n";

// --- internal
import upwind from "../plugins/upwind";
import themes from "@/assets/themes";

// --- utils
import { reduce, last, merge } from "lodash-es";

// --- types
import type { Preview } from "@storybook/your-renderer";
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
    locale: "en",
    fallbackLocale: "en",
    messages: getGlobalMessages(),
  });
  app.use(i18n);

  app.use(upwind);
});

const preview: Preview = {
  parameters: {
    // backgrounds: {
    //   disable: true,
    //   grid: {
    //     disable: true,
    //   },
    // },
    // measure: { disable: true },
    // outline: { disable: true },
    layout: "fullscreen",
    toolbar: {
      zoom: { hidden: true },
      eject: { hidden: true },
      copy: { hidden: true },
      fullscreen: { hidden: true },
    },
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
          { value: "ru", right: "🇷🇺", title: "Russian" },
        ],
      },
    },
  },
  decorators: [
    withUpwindTheme({
      themes,
      defaultTheme: "light",
      locales: [],
      defaultLocale: "en",
    }),
    (story, context) => {
      // This make sit possible to updateArgs within stories
      const [_, updateArgs] = useArgs();
      return story({ ...context, updateArgs });
    },
  ],
};

export default preview;
