// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// private

// --------------------------------------------------------
// Contexts

export interface i18nContext {
  activeLocale: "en" | "es" | "fr" | "de" | "it" | "pt" | "ru" | "zh";
  messages: Record<string, string>;
  // ---
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface i18nEvent {
  type: string;
  data: any;
  error?: RequestError;
}
