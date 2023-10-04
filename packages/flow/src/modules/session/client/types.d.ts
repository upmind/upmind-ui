// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface ClientContext {
  token: Token;
  user: User;
  error?: RequestError;
}

export interface User {}

// --------------------------------------------------------
// Events

export interface ClientEvents {
  type: "CHECK" | "REFRESH" | "LOGIN" | "LOGOUT";
  payload?: any;
}
