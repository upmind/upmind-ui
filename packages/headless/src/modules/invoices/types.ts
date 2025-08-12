// --- types
import type { IBasket, IInvoice } from "@upmind-automation/types";

export type Invoice = IBasket & {
  data: IInvoice["data"];
  locked: IInvoice["locked"];
  payments: IInvoice["payments"];
  products: IInvoice["products"];
  proforma: IInvoice["proforma"];
  //
  objectMeta: IInvoice["object_meta"];
  currentData: IInvoice["current_data"];
  toBeCredited: IInvoice["to_be_credited"];
  proformaNumber: IInvoice["proforma_number"];
  delegateRelated: IInvoice["delegate_related"];
  isConsolidation: IInvoice["is_consolidation"];
  paymentCurrency: IInvoice["payment_currency"];
  paymentCurrencyId: IInvoice["payment_currency_id"];
  netAmountConverted: IInvoice["net_amount_converted"];
  taxAmountConverted: IInvoice["tax_amount_converted"];
  allowProductCredit: IInvoice["allow_product_credit"];
  affiliateCommissions: IInvoice["affiliate_commissions"];
  cancellationDatetime: IInvoice["cancellation_datetime"];
  partialAmountCredited: IInvoice["partial_amount_credited"];
  productUpgradeQuantity: IInvoice["product_upgrade_quantity"];
  proformaCreateDatetime: IInvoice["proforma_create_datetime"];
  partialAmountCreditedConverted: IInvoice["partial_amount_credited_converted"];
  partialAmountCreditedFormatted: IInvoice["partial_amount_credited_formatted"];
  partialAmountToCreditConverted: IInvoice["partial_amount_to_credit_converted"];
  partialAmountToCreditFormatted: IInvoice["partial_amount_to_credit_formatted"];
};
