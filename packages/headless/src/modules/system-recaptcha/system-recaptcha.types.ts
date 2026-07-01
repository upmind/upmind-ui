import type { ResponseError } from "../../utils";

// -----------------------------------------------------------------------------

/**
 * Interface representing the context for Google reCAPTCHA integration,
 * typically managed by an XState machine. It holds the reCAPTCHA site key,
 * the `grecaptcha` object, the generated token, and any associated errors.
 */
export interface RecaptchaContext {
  /**
   * The public site key provided by Google for reCAPTCHA.
   */
  siteKey: string;
  /**
   * The global `grecaptcha` object loaded from Google's reCAPTCHA API script.
   */
  grecaptcha?: any;
  /**
   * The generated reCAPTCHA token, obtained after a successful challenge.
   */
  token?: string;
  /**
   * The `Date` object representing when the reCAPTCHA token was created.
   */
  created?: Date;
  // ---
  /**
   * An error object if any issue occurred during reCAPTCHA processing.
   */
  error?: ResponseError;
}
