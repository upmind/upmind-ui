import {
  BrowserContext,
  Page,
  test as base,
  request,
  expect,
} from "@playwright/test";
import { URLs } from "../../constants/Urls";

/* Extracts the upm_client_session token from the browser context's cookies. */
export async function getSessionToken(
  context: BrowserContext,
  tokenType: string | null
): Promise<string> {
  const cookies = await context.cookies();

  let sessionCookie;
  if (tokenType === "client") {
    sessionCookie = cookies.find(
      cookie => cookie.name === "upm_client_session"
    );
  } else {
    sessionCookie = cookies.find(cookie => cookie.name === "upm_guest_session");
  }
  if (!sessionCookie) {
    throw new Error("Session cookie not found.");
  }

  const rawToken = sessionCookie.value;
  const decodedToken = JSON.parse(
    Buffer.from(rawToken, "base64url").toString("utf-8")
  );
  const accessToken = decodedToken.access_token;

  return accessToken;
}

/* Helper to encode JSON to base64url */
function base64urlEncode(obj: any): string {
  const json = JSON.stringify(obj);
  return Buffer.from(json)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/* Logs in by getting a token and creating the upm_client_session cookie */
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
        accept: "application/json",
        "content-type": "application/json",
        origin: `${URLs.baseUrl}`,
        referer: `${URLs.baseUrl}`,
      },
      data: {
        username: `${username}`,
        password: `${password}`,
        grant_type: "password",
        currency_id: "3825d96e-763e-d091-3dc4-174825283406",
      },
    }
  );
  console.log(JSON.stringify(response));
  const json = await response.json();
  const encodedToken = base64urlEncode(json);

  await page.context().addCookies([
    {
      name: "upm_client_session",
      value: encodedToken,
      domain: "qa-automation.local",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
