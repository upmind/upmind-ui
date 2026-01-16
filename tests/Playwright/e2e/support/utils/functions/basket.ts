import { request, APIRequestContext, Page } from "@playwright/test";
import { URLs } from "../../constants/urls";

export async function createOrder(token: string): Promise<string> {
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
    return body.data.id;
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

export async function getCurrentOrderId(token: string): Promise<string | null> {
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
      `/api/orders/current?with=address%2Caddress.country%2Ccurrency%2Ccustom_fields.field%2Cpromotions%2Ctaxes%2Ctaxes.tax_tag_data%2Cproducts.product.image%2Cproducts.product.images%2Cproducts.product.prices%2Cproducts.product.products_attributes%2Cproducts.product.products_attributes.category%2Cproducts.product.products_options%2Cproducts.product.products_options.category%2Cproducts.product.products_options.prices%2Cproducts.product.provision_field_values%2Cproducts.tags%2Cproducts.product.related%2Cproducts.product.category%2Cproducts.product.category.top_category.top_category.top_category.top_category&lang=en`
    );

    const body = await response.json();
    console.log("ORDER ID:", body?.data?.id);
    return body?.data?.id ?? null;
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
  provisionFieldsValidate: boolean
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
          provision_field_values_validate: provisionFieldsValidate
        }
      }
    );

    const body = await response.json();
    //console.log(`Add to basket - complete! ${JSON.stringify(body)}`);
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
    const body = await response.json();
    console.log(body);
  } finally {
    await apiContext.dispose();
  }
}

export async function overrideWarningNotes(
  page: Page,
  newWarningNotes: string | null
) {
  await page.route("**/api/orders/current**", async route => {
    const response = await route.fetch();
    const text = await response.text();
    let body;

    try {
      body = text ? JSON.parse(text) : {};
    } catch (e) {
      console.warn("Could not parse JSON body, returning as-is");
      return route.fulfill({ response, body: text });
    }

    if (!body.data) body.data = {};
    body.data.warning_notes = [
      {
        id: "3825d96e-763e-d091-3dc4-174825283406",
        message: newWarningNotes,
        translations: {
          code: {
            name: "WARNING"
          }
        },
        created_at: "2025-09-02 08:50:42",
        updated_at: "2025-09-02 08:50:42",
        is_hidden: false
      }
    ];

    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: JSON.stringify(body)
    });
  });
}
