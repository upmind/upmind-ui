// ---
// Contexts

export interface ClientContext {
  user: User;
  error?: RequestError;
  transfer?: string | null;
}

// --------------------------------------------------------
// Events

export interface ClientEvents {
  type: "CHECK" | "LOGOUT" | "TRANSFER";
  payload?: any;
}
