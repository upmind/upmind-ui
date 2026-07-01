/** @internal */
import { useI18n } from "../system-localisation";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useScripts
} from "../../utils";
import { isEmpty } from "lodash-es";
import type { RecaptchaContext } from "./system-recaptcha.types";
import type { AnyEventObject } from "xstate";

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
  const { t } = useI18n();
  // check if the site key is set
  if (isEmpty(siteKey))
    return Promise.reject(
      new DetailedError(
        t("error.recaptcha_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // prevent loading the script multiple times
  if (window["grecaptcha"]) {
    return Promise.resolve(window["grecaptcha"]);
  }

  return useScripts()
    .load(
      "recaptcha",
      `https://www.google.com/recaptcha/api.js?render=${siteKey}`
      // {
      //   onSuccess: () => {
      //     return true;
      //   },
      //   onError: () => {
      //     return false;
      //   }
      // }
    )
    .then(() => {
      return new Promise(resolve => {
        window.grecaptcha.ready(() => {
          return resolve(window["grecaptcha"]);
        });
      });
    });
}

async function generateToken(
  { grecaptcha, siteKey }: RecaptchaContext,
  { data }: AnyEventObject
) {
  const { t } = useI18n();
  if (!grecaptcha || !siteKey)
    return Promise.reject(
      new DetailedError(
        t("error.recaptcha_not_available"),
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
