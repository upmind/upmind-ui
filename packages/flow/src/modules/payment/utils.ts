// --- external

// --- internal

// --- utils

// --- types
import type { PaymentContext } from "./types";

// --------------------------------------------------------

export const usePaymentParser = ({ paymentDetails, order }: PaymentContext) => {
  // TODO pick only the fields that are allowed by the endpoint
  const value = {
    ...paymentDetails,
    //  --- Converted Basket / Order / Invoice
    invoice_id: order.id,
    client_id: order.client_id,
    account_id: order.account_id,
  };

  return value;
};

export const useApprovalParser = ({ payment }: PaymentContext) => {
  // Now we have to parse the approval_url object that is part of the payment
  // into a "form" friendly format:- so we map any query params into fields
  // that will in turn be converted to hidden inputs in the form
  // Remember we may have  been given fields already, so we need to append them
  const approval_url = payment.approval_url;
  const fields = approval_url?.fields || {};
  const url = new URL(approval_url.url);
  url.searchParams.forEach((value, key) => (fields[key] = value));

  payment.approval_form = {
    url: [url.origin, url.pathname].join(""), // only the url without query params
    method: approval_url.method,
    fields,
  };

  return payment;
};
