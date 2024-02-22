// --- external

// --- internal

// --- utils

// --- types
import type { PaymentContext } from "./types";

// --------------------------------------------------------

export const usePaymentParser = ({ paymentDetails, order }: PaymentContext) => {
  return {
    // ---- Payment Details
    //eg:
    //     "store_on_payment": true,
    //     "store_on_payment_auto_payment": true,
    //     "gateway_id": "4d036794-24d0-e710-9d5a-3153698d582e",
    //     "payment_method_addition": {
    //         "payment_method_type": "card",
    //         "payment_method_id": "pm_1Omb7KBiaNfu64y04SkQQ6uX"
    //     },
    //     "amount": 199.98,
    ...paymentDetails,

    //  --- Converted Basket / Order / Invoice
    invoice_id: order.id,
    client_id: order.client_id,
    account_id: order.account_id

    // --- URLS
    // return_url:
    //   "?success=https%3A%2F%2Fq5emenbm0y1p.upmind.dev%2Forder%2Fcomplete%3Foid%3D47d73824-8507-9315-960f-81e642d59e06%26pmt%3Dstored-card&failed=https%3A%2F%2Fq5emenbm0y1p.upmind.dev%2Forder%2Fcomplete%3Foid%3D47d73824-8507-9315-960f-81e642d59e06%26pmt%3Dstored-card",
    // cancel_url:
    //   "https://q5emenbm0y1p.upmind.dev/order/complete?oid=47d73824-8507-9315-960f-81e642d59e06&pmt=stored-card"
  };
};
