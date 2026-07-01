import type { GatewayContext } from "../payment-gateways.types";
import type { GatewayData } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

declare global {
  interface Window {
    OpenPay: OpenPay;
  }
}

export enum OPENPAY_FIELDS {
  MERCHANT_ID = "merchantId",
  PUBLIC_KEY = "publicKey",
  STORED = "stored",
  TEST_MODE = "testMode"
}

export type OpenPayTokenResponse = {
  status: number;
  message: string;
  data: Record<string, any>;
};

export type OpenPay = {
  getApiKey: () => string;
  getSandboxMode: () => boolean;
  id: string;
  setApiKey: (PUBLIC_API_KEY: string) => void;
  setId: (MERCHANT_ID: string) => void;
  setSandboxMode: (FLAG: boolean) => void;
  version: number;
  token: {
    create: (
      CREATE_PARAMETERS_OBJECT: Record<string, any>,
      SUCCESS_CALLBACK: (response: OpenPayTokenResponse) => void,
      ERROR_CALLBACK: (response: OpenPayTokenResponse) => void
    ) => Promise<any>;
  };
  [key: string]: any;
};

export type OpenPayModel = GatewayData & {
  openpay: {
    card_number: string; // eg. '5105105105105100'
    holder_name: string;
    expiration_date: string; // eg. '12/24'
    // expiration_year: string; // eg. '24'
    // expiration_month: string; // eg. '12'
    cvv2: string; // eg. '123'
  };
};

export type OpenPayContext = GatewayContext<{
  sdk?: {
    openPay?: OpenPay;
    deviceSessionId?: string;
  };
  model?: OpenPayModel;
}>;
