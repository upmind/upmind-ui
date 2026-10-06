import { JSDOM } from "jsdom";
// -----------------------------------------------------------------------------

export type PrepaintRun = {
  script: string;
  defaultTheme: string;
  storage?: Record<string, string>;
  prefersDark?: boolean;
  breakStorage?: boolean;
};

export type NuxtHeadScript = {
  innerHTML?: string;
  body?: boolean;
  tagPosition?: string;
};

export type NuxtAppConfig = {
  head: {
    title?: string;
    htmlAttrs?: Record<string, string>;
    meta?: { name?: string; content?: string }[];
    link?: { rel?: string; type?: string; href?: string }[];
    script?: NuxtHeadScript[];
  };
};

/** nuxt.config.ts relies on the loader providing defineNuxtConfig; jiti does it in Nuxt, we do it here. */
export async function loadNuxtConfig(): Promise<{
  app: NuxtAppConfig;
  css: string[];
}> {
  Object.assign(globalThis, { defineNuxtConfig: (config: unknown) => config });
  const mod = await import("../../nuxt.config");
  return mod.default;
}

/** Runs the head script in a fresh document whose <html> carries only the served defaults. */
export function runPrepaint({
  script,
  defaultTheme,
  storage = {},
  prefersDark = false,
  breakStorage = false
}: PrepaintRun) {
  const dom = new JSDOM(
    `<!doctype html><html data-theme="${defaultTheme}"><head></head><body></body></html>`,
    { url: "https://portal.test/", runScripts: "dangerously" }
  );
  const { window } = dom;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("prefers-color-scheme: dark")
        ? prefersDark
        : false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false
    })
  });

  if (breakStorage) {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new window.DOMException(
          "storage is not available",
          "SecurityError"
        );
      }
    });
  } else {
    for (const [key, value] of Object.entries(storage))
      window.localStorage.setItem(key, value);
  }

  const errors: string[] = [];
  window.addEventListener("error", event => errors.push(String(event.message)));

  const element = window.document.createElement("script");
  element.textContent = script;
  window.document.head.appendChild(element);

  const root = window.document.documentElement;
  const result = {
    theme: root.getAttribute("data-theme"),
    isDarkClass: root.classList.contains("dark"),
    errors
  };
  dom.window.close();
  return result;
}
