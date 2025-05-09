// --- internal

// -----------------------------------------------------------------------------

export interface RecaptchaContext {
  siteKey: string;
  grecaptcha?: any;
  token?: string;
  created?: Date;
  // ---
  // TODO:
  // error?: RequestError;
  error?: any;
}
