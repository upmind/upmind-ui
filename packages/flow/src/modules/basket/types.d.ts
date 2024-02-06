// --- extrnal
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// Contexts

export interface BasketContext {
  basket: Basket | null;
  items: Array;
  bin: Array;
  queue: Array;
  custom_fields: Array;
  fieldsModel?: Object;
  fieldsSchema?: JsonSchema;
  fieldsUischema?: UISchemaElement;
  error?: RequestError;
}

export interface Basket {
  account: Object; //IAccount;
  account_id: string; //IAccount["id"];
  address_id: string; //IAddress["id"];
  balance: number;
  balance_formatted: string;
  brand: IBrand;
  brand_id: string; //IBrand["id"];
  category: string; //IBasketCategory;
  category_id: string; // IBasketCategory["id"];
  client: Object; //IClient;
  client_id: string; //IClient["id"];
  company_id: null | string; //ICompany["id"];
  consolidation_invoice_id: null | string; //IInvoice["id"];
  consolidation_status: number;
  contract_id: null | string; //IContract["id"];
  create_datetime: string;
  created_at: string;
  credit_invoice_id: null | string; //IInvoice["id"];
  credited: number;
  currency: Object; //ICurrency;
  currency_id: string; //ICurrency["id"];
  custom_fields: Array; //ICustomFieldValue[];
  deleted_at: string | number;
  due_date: string;
  gateway_id: string; //IGateway["id"];
  id: string;
  legacy: number;
  net_amount: number;
  net_amount_formatted: string;
  net_discount_amount: number;
  net_discount_amount_formatted: string;
  net_global_discount_amount: number;
  net_global_discount_amount_formatted: string;
  net_product_discount_amount: number;
  net_product_discount_amount_formatted: string;
  net_selling_price: number;
  net_selling_price_formatted: string;
  notes: string;
  number: string;
  paid_amount: number;
  paid_amount_converted: number;
  paid_amount_formatted: string;
  paid_datetime: null | number;
  payment_details: Object; //IPaymentDetail;
  payment_details_id: string; //IPaymentDetail["id"];
  pricelist_id: string; //IPricelist["id"];
  products: IBasketProduct[];
  promotions: IBasketPromotion[];
  refund_changed: string | number;
  refund_request: string | number;
  refund_status: number;
  reseller_account_id: null | string; //IAccount["id"];
  status: Object; //IStatus;
  status_id: string; //IStatus["id"];
  total_amount: number;
  total_amount_converted: number;
  total_amount_formatted: string;
  total_discount_amount: number;
  total_discount_amount_formatted: string;
  unpaid_amount: number;
  unpaid_amount_converted: number;
  unpaid_amount_formatted: string;
  updated_at: string;
  user_id: string; //IUser["id"];
  tax_amount: number;
  tax_amount_formatted: string;
  taxes: Array; //IAppliedTax[];
  ip: string;
  warning_notes: Array; //IWarningNote[];
}

// --------------------------------------------------------
// Events

export interface BasketEvents {
  type: "CHECK" | "REFRESH";
  payload?: any;
}
