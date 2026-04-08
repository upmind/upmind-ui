// --- types
import type { Invoice, Payment } from "./types";
import type { IInvoice, InvoiceStatus } from "@upmind-automation/types";

// --- utils
import { useDateMapper } from "../../utils";
import { parseBasketProduct } from "../basketProduct/utils";
import { parseTaxes } from "../basket/utils";
import { mapCurrency } from "../currency/mappers";
import { mapClient } from "../session/utils";
import { mapAddress } from "../client/address/mappers";
import { orderBy, map } from "lodash-es";

// -----------------------------------------------------------------------------

export function mapInvoice(raw: IInvoice): Invoice {
  return {
    id: raw.id,
    locked: !!raw.locked,
    status: raw.status.code as InvoiceStatus,
    number: raw.number,
    client: mapClient(raw.client)!,
    address: raw.address ? mapAddress(raw.address) : undefined,
    currency: mapCurrency(raw.currency),
    products: map(raw.products, product => parseBasketProduct(product)),
    payments: mapPayments(raw.payments),
    summary: {
      discount: raw.net_discount_amount_formatted,
      discountAmount: raw.net_discount_amount,
      paidAmount: raw.paid_amount,
      paidAmountFormatted: raw.paid_amount_formatted,
      subtotal: raw.net_amount_formatted,
      taxes: parseTaxes(raw.taxes),
      total: raw.total_amount_formatted,
      unpaidAmount: raw.unpaid_amount,
      unpaidAmountConverted: raw.unpaid_amount_converted,
      unpaidAmountFormatted: raw.unpaid_amount_formatted
    },
    dateCreated: useDateMapper(raw.create_datetime, undefined, "MMM Do, YYYY"),
    datePaid: useDateMapper(raw.paid_datetime, undefined, "MMM Do, YYYY h:mm A")
  };
}

function mapPayments(payments: IInvoice["payments"]): Payment[] {
  if (!payments?.length) return [];

  const mapped = map(payments, payment => {
    const details = payment.payment_details;
    return {
      id: payment.id,
      meta: {
        isPending: !!payment.pending,
        isSuccessful: !payment.pending && payment.captured > 0
      },
      cardType: details?.card_type,
      cardLast4: details?.card_last4,
      amountFormatted: payment.amount_formatted,
      createdAt: payment.created_at
    };
  });

  return orderBy(mapped, ["createdAt"], ["desc"]);
}
