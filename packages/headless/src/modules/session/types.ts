import { IUser, IClient, AccessRoleTypes } from "@upmind-automation/types";
import { QueryResponseError } from "../query";

// -----------------------------------------------------------------------------
export interface IAuthTransfer {
  client_id: IClient["id"];
  code: string;
  actor_type: AccessRoleTypes;
  actor_id: IUser["id"];
  redirect_url: string;
}

export interface SessionTransfer {
  code: string | null;
  redirect: string | null;
  token?: string | null;
}

export interface SessionContext {
  history?: string[];
  error?: QueryResponseError;
  // ---
  transfer?: SessionTransfer;
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
