// --- utils
import {
  defaultsDeep,
  first,
  forEach,
  get,
  includes,
  isArray,
  isNil,
  map,
  omitBy,
  reduce,
  set
} from "lodash-es";

// --------------------------------------------------------

const translate = (item, field) => {
  const translated = item[`${field}_translated`];
  if (translated) return translated;
  return item[field];
};

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

export const useValidationParser = (error: any) => {
  if (error?.data) {
    error.message = "Validation error";

    const errors = [];
    forEach(error.data, (value, key) => {
      const newError = {
        instancePath: `/${key}`, // AJV style path to the property in the schema
        message: value.toString(),
        // --- optional
        schemaPath: "",
        keyword: "",
        params: {}
      };
      errors.push(newError);
    });

    error.data = errors;
  }

  return error;
};

// --------------------------------------------------------
// Fields

export const useFieldsSchemaParser = (data: any) => {
  const schema = {
    type: "object",
    title: "Fields",
    required: [],
    properties: {
      notes: {
        type: "string",
        title: "Order Notes"
      }
    }
  };

  if (data?.length) {
    const required: string[] = [];
    const properties = {};

    forEach(data, field => {
      if (field.required) required.push(field.code);

      let type = "string";
      let format = null;
      const contentMediaType = null;
      const contentEncoding = null;

      // lets map our field types...
      switch (field.type_code) {
        case "input_number":
        case "number":
          type = "number";
          break;

        case "input-checkbox":
        case "tick_box":
          type = "boolean";
          break;

        case "input_date":
        case "input_datetime":
        case "date":
          type = "string";
          format = "date-time";
          break;

        case "input_email":
        case "email":
          type = "string";
          format = "email";
          break;

        case "input_url":
          type = "string";
          format = "uri";
          break;

        case "input_phone":
          type = "string";
          format = "phone";
          break;

        case "input_ip":
          type = "string";
          format = "ipv4";
          break;

        case "input_ipv6":
          type = "string";
          format = "ipv6";
          break;

        case "input_password":
        case "password":
          type = "string";
          format = "password";
          break;

        // case "input_file":
        // case "image":
        //   type = "string";
        //   contentMediaType = "image";
        //   contentEncoding = "base64";
        //   break;

        default:
          type = "string";
          break;
      }

      // then we set our property based on the field code
      set(
        properties,
        field.code,
        omitBy(
          {
            type,
            format,
            contentMediaType,
            contentEncoding,
            title: translate(field, "name"),
            description: translate(field, "description"),
            default: field.default,
            const: field.const,
            enum: !field.options?.length ? undefined : field.options,
            oneOf: !field.values?.length
              ? undefined
              : map(translate(field, "values"), item => ({
                  const: item.value,
                  title: item.label
                }))
          },
          isNil
        )
      );
    });

    if (required.length) schema.required.push("custom_fields");

    set(schema, "properties.custom_fields", {
      type: "object",
      properties,
      required
    });
  }

  return schema;
};

export const useFieldsUischemaParser = (data: any) => {
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
      }
    ]
  };

  if (data?.length) {
    const group = {
      type: "Group",
      elements: map(data, field => {
        let type = null;
        let multi = false;

        // lets map our field types...
        switch (field.type_code) {
          case "textarea":
          case "text_area":
            multi = true;
            break;

          case "input_number":
          case "number":
            type = "number";
            break;

          case "input_date":
          case "date":
            type = "date";
            break;

          case "input_datetime":
          case "datetime":
            type = "datetime-local";
            break;

          case "input_email":
          case "email":
            type = "email";
            break;

          case "input_password":
          case "password":
            type = "password";
            break;

          case "input_file":
          case "image":
            type = "file";
            break;
        }

        return {
          type: "Control",
          scope: `#/properties/custom_fields/properties/${field.code}`,
          options: {
            label: translate(field, "name"),
            description: translate(field, "description"),
            placeholder: translate(field, "placeholder"),
            multi,
            type
          }
        };
      })
    };

    schema.elements.push(group);
  }

  return schema;
};

export const useFieldsModelParser = (data: any, values: any) => {
  const model = defaultsDeep(values, {
    notes: values?.notes,
    custom_fields: {}
  });

  if (data?.length) {
    forEach(data, field => {
      const value = get(model, `custom_fields.${field.code}`, field?.value);
      set(
        model,
        `custom_fields.${field.code}`,
        value || field?.default || null
      );
    });
  }

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
