import type { RequestError } from "../api/types";
import type {
  GrantTypes,
  IUser,
  TwofaProviders,
} from "@upmind-automation/types";
// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface SessionContext {
  history?: string[];

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

export interface User {
  id: IUser["id"];
  email: IUser["email"];
  name: IUser["name"];
  username: IUser["username"];
  fullname: IUser["fullname"];
  firstname: IUser["firstname"];
  lastname: IUser["lastname"];
  display: string;
  avatar: {
    caption: string;
    src: IUser["image_url"];
    forceCaption: boolean;
  };
  locale: IUser["interface_language_code"];
}
