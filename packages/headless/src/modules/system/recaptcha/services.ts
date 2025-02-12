// --- internal

// --- utils

// --- types
import { AnyEventObject } from "xstate";
import type { RecaptchaContext } from "./types";

// --------------------------------------------------------
// HELPERS

// @ts-ignore
const siteKey = import.meta.env.VITE_APP_GOOGLE_RECAPTCHA_V3_SITE_KEY;

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

interface Window {
  grecaptcha: any;
}

async function load(_context: RecaptchaContext, _event: AnyEventObject) {
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
      // @ts-ignore
      window["grecaptcha"].ready(() => {
        // @ts-ignore
        const grecaptcha = window["grecaptcha"];
        return resolve(grecaptcha);
      });
    });
    document.head.appendChild(script);
  });
}

export async function generateToken(grecaptcha: any, action?: string) {
  if (!grecaptcha) return Promise.reject("Recaptcha not loaded");

  return grecaptcha.execute(siteKey, { action });
}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
};
