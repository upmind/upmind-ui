// --- utils
import {
  useFieldsSchemaParser,
  useFieldsUischemaParser,
  useFieldsModelParser
} from "../../utils";

export { useValidationParser } from "../../utils";

import { first, get, isArray, reduce, set, map, pick } from "lodash-es";

// --- types
// --------------------------------------------------------

export const useBasketParser = (data: any) => {
  data = get(data, "data", data); // handle the reponse types from the api
  data = isArray(data) ? first(data) : data; // usually from the claims endpoint

  return data;
  // TODO:...map properly...
  // return {
  //   account: Object; //IAccount;
  // account_id: string; //IAccount["id"];
  // address_id: string; //IAddress["id"];
  // balance: number;
  // balance_formatted: string;
  // brand: IBrand;
  // brand_id: string; //IBrand["id"];
  // category: string; //IBasketCategory;
  // category_id: string; // IBasketCategory["id"];
  // client: Object; //IClient;
  // client_id: string; //IClient["id"];
  // company_id: null | string; //ICompany["id"];
  // consolidation_invoice_id: null | string; //IInvoice["id"];
  // consolidation_status: number;
  // contract_id: null | string; //IContract["id"];
  // create_datetime: string;
  // created_at: string;
  // credit_invoice_id: null | string; //IInvoice["id"];
  // credited: number;
  // currency: Object; //ICurrency;
  // currency_id: string; //ICurrency["id"];
  // custom_fields: Array; //ICustomFieldValue[];
  // deleted_at: string | number;
  // due_date: string;
  // gateway_id: string; //IGateway["id"];
  // id: string;
  // legacy: number;
  // net_amount: number;
  // net_amount_formatted: string;
  // net_discount_amount: number;
  // net_discount_amount_formatted: string;
  // net_global_discount_amount: number;
  // net_global_discount_amount_formatted: string;
  // net_product_discount_amount: number;
  // net_product_discount_amount_formatted: string;
  // net_selling_price: number;
  // net_selling_price_formatted: string;
  // notes: string;
  // number: string;
  // paid_amount: number;
  // paid_amount_converted: number;
  // paid_amount_formatted: string;
  // paid_datetime: null | number;
  // payment_details: Object; //IPaymentDetail;
  // payment_details_id: string; //IPaymentDetail["id"];
  // pricelist_id: string; //IPricelist["id"];
  // products: IBasketProduct[];
  // promotions: IBasketPromotion[];
  // refund_changed: string | number;
  // refund_request: string | number;
  // refund_status: number;
  // reseller_account_id: null | string; //IAccount["id"];
  // status: Object; //IStatus;
  // status_id: string; //IStatus["id"];
  // total_amount: number;
  // total_amount_converted: number;
  // total_amount_formatted: string;
  // total_discount_amount: number;
  // total_discount_amount_formatted: string;
  // unpaid_amount: number;
  // unpaid_amount_converted: number;
  // unpaid_amount_formatted: string;
  // updated_at: string;
  // user_id: string; //IUser["id"];
  // tax_amount: number;
  // tax_amount_formatted: string;
  // taxes: Array; //IAppliedTax[];
  // ip: string;
  // warning_notes: Array; //IWarningNote[];

  //   // access_token: toString(data?.access_token),
  //   // created_at: toNumber(data?.created_at) || Date.now(),
  //   // expires_in: toNumber(data?.expires_in),
  //   // refresh_expires_in: toNumber(data?.refresh_expires_in),
  //   // refresh_token: toString(data?.refresh_token),
  //   // second_factor_required: isBoolean(data?.isBoolean)
  //   //   ? data?.isBoolean
  //   //   : data?.isBoolean === "true",
  //   // token_type: toString(data?.token_type)
  // };
};

// ---

export const useSummaryParser = (data?: any) => {
  // console.log("useBasketSummaryParser", { basket: data });
  const summary = {
    discount: data?.net_discount_amount_formatted, // total_discount_amount
    subtotal: data?.net_amount_formatted || "", // total_amount
    taxes: data?.tax_amount_formatted, // tax_amount
    total: data?.unpaid_amount_formatted || "" // unpaid_amount
  };
  return summary;
};

// --------------------------------------------------------
// Fields

export const useCustomFieldsSchemaParser = (data: any) => {
  const schema = {
    type: "object",
    title: "Fields",
    required: [],
    properties: {
      notes: {
        type: ["string", "null"],
        title: "Order Notes"
      },
      custom_fields: useFieldsSchemaParser(data)
    }
  };

  return schema;
};

export const useCustomFieldsUischemaParser = (data: any) => {
  const schema = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/notes",
        options: {
          multi: true,
          focus: true,
          autocomplete: "off",
          placeholder: "Add notes here..."
        }
      },
      useFieldsUischemaParser(
        map(data, field => {
          if (["input_file", "image"].includes(field.type_code)) {
            field.options ??= {};

            field.options.field = {
              field_id: field?.id,
              field_type: "client_custom_field",
              field_is_default: false
            };
          }

          return field;
        })
      )
    ]
  };

  return schema;
};

export const useCustomFieldsModelParser = (data: any, values: any) => {
  const model = {
    notes: values?.notes,
    custom_fields: useFieldsModelParser(data, get(values, "custom_fields", {}))
  };

  return model;
};

export const useBasketFieldsModelParser = (data: any, defaults: any) => {
  const notes = get(data, "notes", get(defaults, "notes"));
  const custom_fields = reduce(
    get(data, "custom_fields"),
    (result, { field, value }) => {
      set(result, field.code, value);
      return result;
    },
    get(defaults, "custom_fields", {})
  );

  return {
    notes,
    custom_fields
  };
};
