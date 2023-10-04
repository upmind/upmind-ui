// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface GuestContext {
  token: Token;
  error?: RequestError;
}

// --------------------------------------------------------
// Events

export interface GuestEvents {
  type: "CHECK" | "REFRESH";
  payload?: any;
}
