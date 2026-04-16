import { BrowserContext, Page, request } from "@playwright/test";
import { URLs } from "../constants/urls";

/**
 * Extracts the upm_client_session token from the browser context's cookies.
 */
export async function getSessionToken(
  context: BrowserContext
): Promise<string> {
  const cookies = await context.cookies();
  let sessionCookie =
    cookies.find(c => c.name === "upm_client_session") ||
    cookies.find(c => c.name === "upm_guest_session");

  if (!sessionCookie) {
    throw new Error("Session cookie not found.");
  }

  const parsed = JSON.parse(decodeURIComponent(sessionCookie.value));
  return parsed.access_token;
}

/**
 * Helper to encode JSON to base64url (No longer used in Dev).
 */
function base64urlEncode(obj: any): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Logs in by getting a token and creating the upm_client_session cookie.
 */
export async function getClientToken(
  page: Page,
  username: string,
  password: string
) {
  const apiContext = await request.newContext();
  const response = await apiContext.post(
    "https://api.staging.upmind.io/oauth/access_token",
    {
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        origin: `${URLs.baseUrl}`,
        referer: `${URLs.baseUrl}`
      },
      data: {
        currency_id: "3825d96e-763e-d091-3dc4-174825283406",
        grant_type: "password",
        password: `${password}`,
        username: `${username}`
      }
    }
  );

  const json = await response.json();
  await page.context().addCookies([
    {
      name: "upm_client_session",
      value: JSON.stringify(json),
      domain: "qa-automation.local",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax"
    }
  ]);
  console.log(json);
  return json;
}
