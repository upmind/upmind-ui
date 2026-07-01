/** @internal */
// // --- utils
// import { get, map, isArray, compact } from "lodash-es";
import { useTranslateName } from "../../utils";
import type { CustomField } from "./client-custom-fields.types";
import type { ICustomField } from "@upmind-automation/types";

// --- types

// // ---
// export function mapC(raw: IAddress | IAddress[]): Address[] {
//   // we could get a plain address OR a company with and address
//   // so we normalize the data to always be an array of addresses
//   // this is to allow for a 'unified' way of handling addresses
//   const rawListings = isArray(raw) ? raw : [raw];
//   return map(rawListings, mapAddress);
// }

export function mapCustomField(raw: ICustomField): CustomField {
  return {
    id: raw.id,
    code: raw.code,
    name: useTranslateName(raw),
    type: raw.type_code,
    options: raw.values,
    meta: {
      // isHidden: raw.hidden,
      showOnInvoice: raw.show_on_invoice,
      showOnOrderForm: raw.show_on_order_form,
      isReadOnly: raw.client_readonly,
      isRequired: raw.required,
      isDisabled: raw.client_readonly
    }
  };
}
