/// <reference types="@types/mercadopago-sdk-js" />
import { type GatewayData } from "@upmind-automation/types";
import type { GatewayContext } from "../types";
// -----------------------------------------------------------------------------

declare global {
  interface Window {
    MercadoPago: mercadopago.MercadoPago;
  }
}

export enum MERCADOPAGO_FIELDS {
  MERCHANT_ID = "merchantId",
  PUBLIC_KEY = "publicKey",
  STORED = "stored",
  TEST_MODE = "testMode"
}

export type MercadoPagoTokenResponse = {
  status: number;
  message: string;
  data: Record<string, any>;
};

export type MercadoPagoContext = GatewayContext<{
  sdk?: {
    mercadoPago: mercadopagocore.MercadoPagoCore;
    mercadoPagoController?: bricks.CardPaymentController;
  };
}>;
