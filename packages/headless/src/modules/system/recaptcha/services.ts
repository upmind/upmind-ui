// --- internal

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import { AnyEventObject } from "xstate";
import type { RecaptchaContext } from "./types";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useScripts
} from "../../../utils";

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
        "Recaptcha site key not set",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // prevent loading the script multiple times
  if (window["grecaptcha"]) {
    return Promise.resolve(window["grecaptcha"]);
  }

  return useScripts().load(
    "recaptcha",
    `https://www.google.com/recaptcha/api.js?render=${siteKey}`,
    {
      onSuccess: async () =>
        new Promise(resolve => {
          window.grecaptcha.ready(() => resolve(window["grecaptcha"]));
        })
    }
  );
}

async function generateToken(
  { grecaptcha, siteKey }: RecaptchaContext,
  { data }: AnyEventObject
) {
  if (!grecaptcha || !siteKey)
    return Promise.reject(
      new DetailedError(
        "Recaptcha not loaded",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  return grecaptcha.execute(siteKey, { action: data.action });
}

// -----------------------------------------------------------------------------

export default {
  load,
  generateToken
};
