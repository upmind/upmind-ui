// --- internal

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import { AnyEventObject } from "xstate";
import type { RecaptchaContext } from "./types";
import { DetailedError, ErrorOrigin, responseCodes } from "../../../utils";

// -----------------------------------------------------------------------------

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

async function load({ siteKey }: RecaptchaContext, _event: AnyEventObject) {
  // check if the site key is set
  if (isEmpty(siteKey))
    return Promise.reject(
      new DetailedError(
        "[headless] Recaptcha site key not set",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // prevent loading the script multiple times
  if (window["grecaptcha"]) {
    return Promise.resolve(window["grecaptcha"]);
  }

  const src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");

    script.setAttribute("src", src);
    script.setAttribute("async", "true");

    script.addEventListener("error", async () => {
      return reject(
        new DetailedError(
          "[headless] Recaptcha failed to load",
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless
        )
      );
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

async function generateToken(
  { grecaptcha, siteKey }: RecaptchaContext,
  { data }: AnyEventObject
) {
  if (!grecaptcha || !siteKey)
    return Promise.reject(
      new DetailedError(
        "[headless] Recaptcha not loaded",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless,
        { data }
      )
    );

  return grecaptcha.execute(siteKey, { action: data.action });
}

// -----------------------------------------------------------------------------

export default {
  load,
  generateToken,
};
