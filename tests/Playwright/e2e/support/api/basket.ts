import { request, APIRequestContext, Page } from "@playwright/test";
import { URLs } from "../constants/urls";

export interface Order {
  id: string;
  number: string | null;
  status_id: string;
  brand_id: string;
  account_id: string | null;
  client_id: string | null;
  gateway_id: string | null;
  category_id: string;
  currency_id: string;
  total_amount: number;
  net_amount: number;
  tax_amount: number;
  paid_amount: number;
  total_amount_formatted: string;
  display_status: string;
  products: unknown[];
  promotions: unknown[];
}

export async function createOrder(token: string): Promise<Order> {
  const context: APIRequestContext = await request.newContext({
    baseURL: `${URLs.apiUrl}`,
    extraHTTPHeaders: {
      accept: "*/*",
      "accept-language": "en-GB;q=0.9,en;q=0.8",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: `${URLs.apiOrigin}`,
      referer: `${URLs.apiUrl}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

  try {
    const response = await context.post(`/api/orders?lang=en`, {
      data: { category_slug: "new_contract", currency_code: "GBP" }
    });

    const body = await response.json();
    return body.data;
  } finally {
    await context.dispose();
  }
}

export async function getBasketProducts(token: string) {
  const response = await fetch(
    `${URLs.apiUrl}api/orders/current?with=address%2Caddress.country%2Ccurrency%2Ccustom_fields.field%2Cpromotions%2Ctaxes%2Ctaxes.tax_tag_data%2Cproducts.product.image%2Cproducts.product.images%2Cproducts.product.prices%2Cproducts.product.products_attributes%2Cproducts.product.products_attributes.category%2Cproducts.product.products_options%2Cproducts.product.products_options.category%2Cproducts.product.products_options.prices%2Cproducts.product.provision_blueprint%2Cproducts.product.provision_field_values%2Cproducts.tags%2Cproducts.product.related%2Cproducts.product.category%2Cproducts.product.category.top_category.top_category.top_category.top_category&lang=en`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        Origin: `${URLs.apiOrigin}`
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch current order: ${response.status} ${response.statusText} - ${errorText}`
    );
  }
  const body = await response.json();
  console.log(`Current Basket: ${JSON.stringify(body.data.products)}`);
  return body.data.products ?? null;
}

export async function getCurrentOrder(
  token: string
): Promise<Record<string, any> | null> {
  const context: APIRequestContext = await request.newContext({
    baseURL: "https://api.staging.upmind.io",
    extraHTTPHeaders: {
      accept: "*/*",
      "accept-language": "en-GB;q=0.9,en;q=0.8",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: `${URLs.apiOrigin}`,
      referer: `${URLs.apiUrl}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

  try {
    const response = await context.get("/api/orders/current");

    if (!response.ok()) {
      console.log(
        `Failed to fetch current order: ${response.status()} ${response.statusText()}`
      );
      return null;
    }

    const text = await response.text();
    if (!text) {
      console.log("Empty response from get current order");
      return null;
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.log("Failed to parse JSON from get current order", text);
      return null;
    }

    console.log("ORDER ID:", body?.data?.id);
    return body?.data ?? null;
  } finally {
    await context.dispose();
  }
}

export async function addProductToOrder(
  token: string,
  orderId: string | null,
  productId: string,
  qty: number,
  billingCycle: number,
  attributeValues: [],
  optionValues: [],
  provisionFields: {},
  promotionValues: [],
  provisionFieldsValidate: boolean,
  start_trial: boolean
): Promise<any> {
  const context: APIRequestContext = await request.newContext({
    baseURL: `${URLs.apiUrl}`,
    extraHTTPHeaders: {
      accept: "*/*",
      "accept-language": "en-GB;q=0.9,en;q=0.8",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: `${URLs.apiOrigin}`,
      referer: `${URLs.apiUrl}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

  try {
    const response = await context.post(
      `/api/orders/${orderId}/products?lang=en`,
      {
        data: {
          product_id: productId,
          quantity: qty,
          billing_cycle_months: billingCycle,
          attributes: attributeValues,
          options: optionValues,
          provision_field_values: provisionFields,
          promotions: promotionValues,
          provision_field_values_validate: provisionFieldsValidate,
          start_trial: start_trial
        }
      }
    );

    if (!response.ok()) {
      throw new Error(
        `Failed to add product to order: ${response.status()} ${response.statusText()}`
      );
    }

    const body = await response.json();
    return body;
  } finally {
    await context.dispose();
  }
}

export async function removeProductFromOrder(
  token: string,
  orderId: string | null,
  productId: string
): Promise<any> {
  const context: APIRequestContext = await request.newContext({
    baseURL: `${URLs.apiUrl}`,
    extraHTTPHeaders: {
      accept: "*/*",
      "accept-language": "en-GB;q=0.9,en;q=0.8",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: `${URLs.apiOrigin}`,
      referer: `${URLs.apiUrl}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

  try {
    const response = await context.delete(
      `api/orders/${orderId}/products/${productId}?lang=en`
    );
    const body = await response.json();
    console.log(`Product removal for ${orderId}: ${JSON.stringify(body)}`);
    return body;
  } finally {
    await context.dispose();
  }
}

export async function addPromotionToOrder(
  orderId: string | null,
  promoCode: string,
  token: string | null
): Promise<any> {
  const apiContext: APIRequestContext = await request.newContext();

  try {
    const response = await apiContext.post(
      `${URLs.apiUrl}api/orders/${orderId}/promotions?lang=en`,
      {
        headers: {
          accept: "*/*",
          "accept-language":
            "en-GB,en;q=0.9,es;q=0.8,am;q=0.7,af;q=0.6,su;q=0.5,yi;q=0.3,zu;q=0.2",
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          origin: `${URLs.apiOrigin}`,
          referer: `${URLs.baseUrl}`,
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
        },
        data: {
          promocode: promoCode
        }
      }
    );
    if (!response.ok()) {
      throw new Error(
        `Failed to apply promotion code: ${response.status()} ${response.statusText()}`
      );
    }
    console.log("Promotion added");
    return response.json();
  } finally {
    await apiContext.dispose();
  }
}

export async function setOrderCurrency(
  token: string,
  orderId: string | null,
  currency: string
) {
  if (!orderId) {
    throw new Error("Order ID is null or undefined");
  }
  const apiContext = await request.newContext({
    baseURL: "https://api.staging.upmind.io",
    extraHTTPHeaders: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "*/*"
    }
  });

  try {
    const response = await apiContext.put(
      `/api/orders/${orderId}/currency?lang=en`,
      {
        data: {
          currency_code: `${currency}`
        }
      }
    );
    await response.json();
  } finally {
    await apiContext.dispose();
  }
}

export async function setOrderAddress(
  token: string,
  orderId: string,
  addressId: string,
  companyId: string | null = null,
  phoneId: string | null = null
): Promise<Record<string, any>> {
  const context: APIRequestContext = await request.newContext({
    baseURL: `${URLs.apiUrl}`,
    extraHTTPHeaders: {
      accept: "*/*",
      "accept-language": "en-GB;q=0.9,en;q=0.8",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: `${URLs.apiOrigin}`,
      referer: `${URLs.apiUrl}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

  try {
    const response = await context.put(`/api/orders/${orderId}?lang=en`, {
      data: {
        address_id: addressId,
        company_id: companyId,
        phone_id: phoneId
      }
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(
        `Failed to set order address: ${response.status()} ${response.statusText()} - ${errorText}`
      );
    }

    const body = await response.json();
    return body.data;
  } finally {
    await context.dispose();
  }
}

export async function getInvoice(
  token: string,
  invoiceId: string
): Promise<Record<string, any> | null> {
  const context: APIRequestContext = await request.newContext({
    baseURL: "https://api.staging.upmind.io",
    extraHTTPHeaders: {
      accept: "*/*",
      "accept-language": "en-GB;q=0.9,en;q=0.8",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: `${URLs.apiOrigin}`,
      referer: `${URLs.apiUrl}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

  try {
    const response = await context.get(
      `/api/invoices/${invoiceId}?with=brand%2Ctaxes%2Cclient%2Cstatus%2Ccontract%2Cpayments%2Cpayments.payment_details%2Cproducts%2Cpromotions%2Cclient.tags%2Cproducts.tags%2Ctaxes.tax_tag_data%2Ccustom_fields.field%2Caffiliate_commissions%2Cproducts.product.image%2Caccount.affiliate_referral.affiliate_account.account.client&lang=en`
    );

    const body = await response.json();
    return body?.data ?? null;
  } finally {
    await context.dispose();
  }
}
