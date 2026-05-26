import { BrowserContext, Page, request } from "@playwright/test";
import { URLs } from "../constants/urls";
import { getSessionToken } from "./auth";
import { faker } from "@faker-js/faker";

// -----------------------------------------------------------------------------

/** Default GBP currency ID used across the staging environment. */
const DEFAULT_CURRENCY_ID = "3825d96e-763e-d091-3dc4-174825283406";

/** Options for configuring client registration. */
export type RegisterClientOptions = {
  /** Override the email address (default: auto-generated). */
  email?: string;
  /** Override the first name (default: faker-generated). */
  firstname?: string;
  /** Override the last name (default: faker-generated). */
  lastname?: string;
  /** Override the password (default: "Password1!"). */
  password?: string;
  /** Override the currency ID (default: GBP). */
  currencyId?: string;
};

/** Shape of the data returned by a successful registration API call. */
export type RegisterClientResponse = {
  email: string;
  password: string;
};

/**
 * Registers a new client account via the Upmind API.
 *
 * Uses POST /api/clients/register with faker-generated user data.
 * Follows the same request context pattern as createOrder() in basket.ts.
 *
 * @param guestToken - A valid guest session bearer token
 * @param options - Optional overrides for registration fields
 * @returns The registration response with the new client's access token,
 *          plus the email and password used for registration
 */
export async function registerClient(
  guestToken: string,
  options: RegisterClientOptions = {}
): Promise<RegisterClientResponse> {
  const email =
    options.email ??
    `nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`;
  const password = options.password ?? "Password1!";
  const firstname = options.firstname ?? faker.person.firstName();
  const lastname = options.lastname ?? faker.person.lastName();
  const currencyId = options.currencyId ?? DEFAULT_CURRENCY_ID;

  const apiContext = await request.newContext({
    baseURL: `${URLs.apiUrl}`,
    extraHTTPHeaders: {
      accept: "*/*",
      "accept-language": "en-GB;q=0.9,en;q=0.8",
      authorization: `Bearer ${guestToken}`,
      "content-type": "application/json",
      origin: `${URLs.apiOrigin}`,
      referer: `${URLs.baseUrl}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    }
  });

  try {
    const response = await apiContext.post(`/api/clients/register?lang=en`, {
      data: {
        custom_fields: {},
        email,
        username: email,
        firstname,
        lastname,
        password,
        currency_id: currencyId
      }
    });

    if (!response.ok()) {
      const errorText = await response.text();
      throw new Error(
        `Registration failed: ${response.status()} ${response.statusText()} - ${errorText}`
      );
    }

    const json = await response.json();
    console.log(json);
    return {
      ...json.data,
      email,
      password
    };
  } finally {
    await apiContext.dispose();
  }
}

/**
 * Registers a new client account via the API and sets the session cookie.
 *
 * Convenience function that:
 * 1. Gets the guest session token from browser cookies
 * 2. Calls registerClient() to register via the API
 * 3. Sets the upm_client_session cookie with the new client token
 *
 * @param page - Playwright Page instance
 * @param context - Browser context (used to read guest token and set client cookie)
 * @param options - Optional overrides for registration fields
 * @returns The registered user's details (email, password, access_token)
 */
export async function registerAndLogin(
  page: Page,
  context: BrowserContext,
  options: RegisterClientOptions = {}
): Promise<RegisterClientResponse> {
  const guestToken = await getSessionToken(context);
  const registrationResponse = await registerClient(guestToken, options);

  // Set the client session cookie with the registration response
  // This follows the same pattern as getClientToken() in auth.ts
  await context.addCookies([
    {
      name: "upm_client_session",
      value: JSON.stringify(registrationResponse),
      domain: "qa-automation.local",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax"
    }
  ]);

  return registrationResponse;
}

/**
 * Fetches the current order and returns its address ID.
 *
 * @param token - Bearer token for authentication
 * @returns The address ID from the current order, or null if not set
 */
export async function getCurrentAddressId(
  token: string
): Promise<string | null> {
  const response = await fetch(
    `${URLs.apiUrl}api/orders/current?with=address%2Caddress.country%2Ccurrency%2Ccustom_fields.field%2Cpromotions%2Ctaxes%2Ctaxes.tax_tag_data%2Cproducts.product.image%2Cproducts.product.images%2Cproducts.product.prices%2Cproducts.product.products_attributes%2Cproducts.product.products_attributes.category%2Cproducts.product.products_options%2Cproducts.product.products_options.category%2Cproducts.product.products_options.prices%2Cproducts.product.provision_blueprint%2Cproducts.product.provision_field_values%2Cproducts.tags%2Cproducts.product.related%2Cproducts.product.category%2Cproducts.product.category.top_category.top_category.top_category.top_category&lang=en`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        Origin: URLs.apiOrigin
      }
    }
  );
  const body = await response.json();
  return body.data.address_id ?? null;
}

/**
 * Adds a hardcoded 10 Downing Street address to a client account via the API.
 *
 * @param token - Bearer token for the client session
 * @param clientId - The client UUID to add the address to
 * @returns The created address data from the API response
 */
export async function addAddressToClient(
  token: string,
  clientId: string
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${URLs.apiUrl}api/clients/${clientId}/addresses`,
    {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        origin: `${URLs.apiOrigin}`
      },
      body: JSON.stringify({
        name: "10 Downing Street",
        address_1: "10 Downing Street",
        address_2: "",
        country_id: "320e4357-95e7-8d18-484f-31643202d986",
        region_id: "de78642d-e539-7146-295f-21208469530d",
        city: "London",
        postcode: "SW1A 2AB",
        type: 1,
        default: false
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to add address to client ${clientId}: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const body = await response.json();
  return body.data;
}
