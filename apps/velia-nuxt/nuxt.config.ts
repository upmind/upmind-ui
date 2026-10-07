import { resolve } from "path";
import { find } from "lodash-es";

export default defineNuxtConfig({
  extends: ["../cart-nuxt"],

  hooks: {
    // Swapped in place: a same-name middleware file would run after cart-nuxt's routing guard.
    "app:resolve": app => {
      const redirects = find(app.middleware, {
        path: resolve(
          __dirname,
          "../cart-nuxt/app/middleware/redirects.global.ts"
        )
      });
      if (!redirects) {
        throw new Error("cart-nuxt's redirects middleware is missing");
      }

      redirects.path = resolve(__dirname, "./app/redirects.ts");
    }
  },

  app: {
    head: {
      link: [
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png"
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png"
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png"
        },
        { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#000000" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: ""
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap"
        }
      ],
      meta: [
        { name: "msapplication-TileColor", content: "#000000" },
        { name: "theme-color", content: "#ffffff" }
      ]
    }
  }
});
