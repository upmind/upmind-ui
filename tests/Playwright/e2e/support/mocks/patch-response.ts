import { BrowserContext, Route, APIResponse } from "@playwright/test";

function setDeepValue(obj: Record<string, any>, path: string, value: any) {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (i === keys.length - 1) {
      current[key] = value;
    } else {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }
  }
}

export async function interceptAndPatchResponse(
  context: BrowserContext,
  urlPattern: string | RegExp,
  path: string,
  newValue: any
) {
  await context.route(urlPattern, async (route: Route) => {
    const response = await route.fetch();

    let body: any;
    try {
      body = await response.json();
    } catch (e) {
      console.warn("Could not parse JSON body, returning as-is");
      return route.fulfill({ response });
    }
    setDeepValue(body, path, newValue);

    await route.fulfill({
      status: response.status(),
      headers: {
        ...response.headers(),
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
  });
}
