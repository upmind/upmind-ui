// --------------------------------------------------------
// ENUMS

export enum AccessRoleTypes {
  GUEST = "guest",
  CLIENT = "client",
  RESELLER = "reseller",
  USER = "user"
}

export enum GrantTypes {
  ADMIN = "admin",
  ADMIN_PASSWORD_RESET = "admin_password_reset",
  COMPLETE_ORG_REGISTRATION = "complete_org_registration",
  COMPLETE_USER_REGISTRATION = "complete_user_registration",
  COMPLETE_REGISTRATION = "complete_registration",
  GUEST = "guest",
  GUEST_CUSTOMER = "guest_customer",
  PASSWORD = "password",
  PASSWORD_RESET = "password_reset",
  REFRESH_TOKEN = "refresh_token",
  TWOFA_ADMIN = "twofa-admin",
  TWOFA = "twofa"
}

export enum TwofaProviders {
  GOOGLE = "google"
}

// --------------------------------------------------------
// Contexts

export interface SessionContext {
  debug: boolean;
  role: AccessRoleTypes;
  token: SessionToken;
  error?: RequestError;
}

export interface SessionToken {
  access_token: string | null;
  created_at?: number | null;
  expires_in: number | null;
  refresh_expires_in: number | null;
  refresh_token: string | null;
  second_factor_required: boolean | null;
  token_type: string | null;
  // ---
  redirect?: Location["origin"] | null;
  actor_id?: string | null;
  actor_type?: AccessRoleTypes | null;
}

// --------------------------------------------------------
// Events

export interface SessionEvents {
  type: "CHECK" | "REFRESH";
  payload?: any;
}
