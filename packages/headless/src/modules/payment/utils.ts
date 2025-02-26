// --- external

// --- internal

// --- utils
import { pick, omit, unset, set, has } from "lodash-es";

// --- types
import type { PaymentContext } from "./types";

// --------------------------------------------------------

export const usePaymentParser: any = ({
  paymentDetails,
  order,
}: PaymentContext) => {
  // TODO pick only the fields that are allowed by the endpoint
  const safeValues = omit(paymentDetails, ["type", "gateway"]);

  // --- Check for paymentDetails, if so we dont need the gateway_id
  if (has(paymentDetails, "payment_details_id"))
    unset(safeValues, "gateway_id");
  //  --- Converted Basket / Order / Invoice
  set(safeValues, "invoice_id", order?.id);
  set(safeValues, "client_id", order?.client_id);
  set(safeValues, "account_id", order?.account_id);

  return safeValues;
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
