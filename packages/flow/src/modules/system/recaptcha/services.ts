// --- internal
import { useApi } from "../../api";
import { useBrand, BrandConfigKeys } from "../../brand";

// --- utils
import { includes, isEmpty, get } from "lodash-es";

// --- types
import type { RecaptchaEvent, RecaptchaContext } from "./types.d";

// --------------------------------------------------------
// HELPERS

const siteKey = import.meta.env.VITE_APP_GOOGLE_RECAPTCHA_V3_SITE_KEY;

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

async function load(_context: RecaptchaContext, _event: RecaptchaEvent) {
  // if we have a hash, we can skip the request

  const src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.setAttribute("src", src);
    script.setAttribute("async", "true");

    script.addEventListener("error", async () => {
      return reject("Recaptcha failed to load");
    });

    script.addEventListener("load", async () => {
      window["grecaptcha"].ready(() => {
        const grecaptcha = window["grecaptcha"];
        return resolve(grecaptcha);
      });
    });
    document.head.appendChild(script);
  });
}

async function generate({ grecaptcha }: any, { data }: any) {
  if (!grecaptcha) return Promise.reject("Recaptcha not loaded");

  return grecaptcha.execute(siteKey, { action: data });
}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  generate,
};
