// --- internal

// --- utils

// --- types
import { AnyEventObject } from "xstate";
import type { RecaptchaContext } from "./types";

// -----------------------------------------------------------------------------

const siteKey = import.meta.env.VITE_APP_GOOGLE_RECAPTCHA_V3_SITE_KEY;

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (
        siteKey: string,
        options: { action?: string }
      ) => Promise<string>;
    };
  }
}

async function load(_context: RecaptchaContext, _event: AnyEventObject) {
  // if we have a hash, we can skip the request

  const src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.setAttribute("src", src);
    script.setAttribute("async", "true");

    script.addEventListener("error", async () => {
      return reject(new Error("Recaptcha failed to load"));
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

export async function generateToken(grecaptcha: any, action?: string) {
  if (!grecaptcha) return Promise.reject(new Error("Recaptcha not loaded"));

  return grecaptcha.execute(siteKey, { action });
}

// -----------------------------------------------------------------------------

export default {
  load,
};
