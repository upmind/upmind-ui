import { request, APIRequestContext } from "@playwright/test";
import { URLs } from "../../constants/urls";

export async function getCurrentOrder(token: string) {
  const response = await fetch(`${URLs.apiUrl}api/orders/current`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch current order: ${response.status} ${response.statusText} - ${errorText}`
    );
  }
  const data = await response.json();
  //console.log(`Current Basket: ${JSON.stringify(data)}`);
  return data;
}

export async function getCurrentOrderId(token: string): Promise<string | null> {
  const context: APIRequestContext = await request.newContext({
    baseURL: "https://api.staging.upmind.io",
    extraHTTPHeaders: {
      accept: "*/*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: `${URLs.apiOrigin}`,
      referer: `${URLs.apiUrl}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

  const response = await context.get(
    `/api/orders/current?with=address%2Caddress.country%2Ccurrency%2Ccustom_fields.field%2Cpromotions%2Ctaxes%2Ctaxes.tax_tag_data%2Cproducts.product.image%2Cproducts.product.images%2Cproducts.product.prices%2Cproducts.product.products_attributes%2Cproducts.product.products_attributes.category%2Cproducts.product.products_options%2Cproducts.product.products_options.category%2Cproducts.product.products_options.prices%2Cproducts.product.provision_field_values%2Cproducts.tags%2Cproducts.product.related%2Cproducts.product.category%2Cproducts.product.category.top_category.top_category.top_category.top_category&lang=en`
  );

  const body = await response.json();
  console.log("ORDER ID:", body?.data?.id);
  return body?.data?.id ?? null;
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
  promotionValues: []
): Promise<any> {
  const context: APIRequestContext = await request.newContext({
    baseURL: `${URLs.apiUrl}`,
    extraHTTPHeaders: {
      accept: "*/*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      origin: `${URLs.apiOrigin}`,
      referer: `${URLs.apiUrl}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

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
        promotions: promotionValues
      }
    }
  );

  const body = await response.json();
  //console.log(`Add to basket - complete! ${JSON.stringify(body)}`);
  return body;
}
