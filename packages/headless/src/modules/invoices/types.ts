// --- types
import type { BasketProduct } from "../basketProduct";
import type { Address } from "../client/address/types";
import type { Currency } from "../currency/types";
import type { Client } from "../session/types";
import type { FormattedDate } from "../../utils";
import type { InvoiceStatus } from "@upmind-automation/types";

export enum PAYMENT_STATE {
  COMPLETE = "complete",
  FREE = "free",
  PARTIAL = "partial",
  FAILED = "failed",
  PENDING = "pending"
}

export type PaymentState = `${PAYMENT_STATE}`;

export type Invoice = {
  id: string;
  locked: boolean;
  status: InvoiceStatus;
  number: string;
  client: Client;
  address?: Address;
  currency: Currency;
  products: BasketProduct[];
  payments: Payment[];
  summary: {
    discount: string;
    discountAmount: number;
    paidAmount: number;
    paidAmountFormatted: string;
    subtotal: string;
    taxes: { title: string; amount: string }[];
    total: string;
    unpaidAmount: number;
    unpaidAmountConverted: number;
    unpaidAmountFormatted: string;
  };
  dateCreated: FormattedDate;
  dateDue: FormattedDate;
  datePaid: FormattedDate;
};

export type Payment = {
  id: string;
  meta: {
    isPending: boolean;
    isSuccessful: boolean;
  };
  cardType: string | null;
  cardLast4: string | null;
  amountFormatted: string;
  createdAt: string;
};
