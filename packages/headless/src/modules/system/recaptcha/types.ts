// --- internal
import type { RequestError } from "../../api/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface RecaptchaContext {
  grecaptcha?: any;
  token?: string;
  created?: Date;
  // ---
  // TODO:
  // error?: RequestError;
  error?: any;
}
