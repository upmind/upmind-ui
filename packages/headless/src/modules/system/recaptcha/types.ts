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

// --------------------------------------------------------
// Events

export interface RecaptchaEvent {
  type: string;
  data: any;
  // TODO:
  // error?: RequestError;
  error?: any;
}
