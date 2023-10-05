// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface GuestContext {
  token: Token;
  error?: RequestError;
  refresh?: boolean;
}

// --------------------------------------------------------
// Events

export interface GuestEvents {
  type: "CHECK" | "REFRESH";
  payload?: any;
}
