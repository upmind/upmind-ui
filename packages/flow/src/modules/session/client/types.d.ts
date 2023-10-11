// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface ClientContext {
  token: Token;
  model: ClientModel;
  error?: RequestError;
  refresh?: boolean;
  customFields?: Array<Object>;
}

export interface ClientModel {
  custom_fields: { [key: string]: number | string | boolean };
  email: string;
  firstname: string;
  lastname: string;
  password: string;
  phone: IPhone["phone"] | null;
  phone_code: IPhone["phone_code"] | null;
  phone_country_code: IPhone["phone_country_code"] | null;
  recaptcha_token: string;
}
// --------------------------------------------------------
// Events

export interface ClientEvents {
  type: "CHECK" | "REFRESH" | "LOGIN" | "LOGOUT";
  payload?: any;
}
