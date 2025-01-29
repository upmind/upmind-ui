import type { RequestError } from "../api/types";
import type { GrantTypes, TwofaProviders } from "@upmind-automation/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface SessionContext {
  // TODO:
  // error?: RequestError | null;
  error?: any | null;
}

export interface Token {
  access_token: string | null;
  created_at?: number | null;
  expires_in: number | null;
  refresh_expires_in: number | null;
  refresh_token: string | null;
  second_factor_required: boolean | null;
  // ---
  redirect?: Location["origin"] | null;
  actor_id?: string | null;
  actor_type?: "guest" | "client" | "reseller" | "user" | null;
  // ---
  guest_token?: string | null;
}

export interface User {}

// --------------------------------------------------------
// Events

export interface SessionEvents {
  type: "CHECK" | "REFRESH";
  payload?: any;
}
