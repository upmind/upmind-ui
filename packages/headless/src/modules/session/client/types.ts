// ---
// Contexts

export interface ClientContext {
  // TODO:
  // user: User;
  // error?: RequestError;
  user: any;
  error?: any;
  transfer?: string | null;
}

// --------------------------------------------------------
// Events

export interface ClientEvents {
  type: "CHECK" | "LOGOUT" | "TRANSFER";
  payload?: any;
}
