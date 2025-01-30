// --- internal
import type { IUser } from "@upmind-automation/types";
import type { User } from "../types";
// import type { RequestError } from "../../api/types";

// ---
// Contexts

export interface ClientContext {
  user?: User;
  error?: any;
  transfer?: string | null;
}

// --------------------------------------------------------
// Events

export interface ClientEvents {
  type: "CHECK" | "LOGOUT" | "TRANSFER";
  payload?: any;
}
