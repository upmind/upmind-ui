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
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface RecaptchaEvent {
  type: string;
  data: any;
  error?: RequestError;
}
