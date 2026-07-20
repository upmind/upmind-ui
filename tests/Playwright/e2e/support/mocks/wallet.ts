import type { BrowserContext, Route } from "@playwright/test";

/**
 * Mocks ONLY the wallet-balance read, to simulate a client with account credit
 * at checkout. A fresh `newUser` has no real staging credit, so the balance is
 * a legitimate *settings/account-state* mock (ADR 021 P4) — it lets a test
 * assert the Account Credit UI without provisioning a funded staging account.
 *
 * Intercepts:
 *  - GET /api/wallet/balance — returns a mocked IWalletBalance
 *
 * It deliberately does NOT mock `POST /cart/calculate`: that is the endpoint
 * `useCalculate` consolidated, and mocking it is a P4 violation (journey data,
 * not a setting). The account-credit total is formatted through the REAL
 * `useCalculate` → `POST /cart/calculate` from the owned+credit balance
 * (payment-details.services), so it must hit staging. See FE-2791.
 *
 * @param context - Browser context to register the route on
 * @param options - Configurable credit amounts and currency
 */
export function mockWalletBalance(
  context: BrowserContext,
  options: {
    ownedAmount?: number;
    creditAmount?: number;
    currencyCode?: string;
    currencyId?: string;
  } = {}
) {
  const {
    ownedAmount = 5,
    creditAmount = 0,
    currencyCode = "GBP",
    currencyId = "3825d96e-763e-d091-3dc4-174825283406"
  } = options;

  // Helper to format amount as currency string
  const formatAmount = (amount: number, code: string): string => {
    const symbols: Record<string, string> = {
      GBP: "£",
      USD: "$",
      EUR: "€",
      AUD: "A$",
      INR: "₹"
    };
    const symbol = symbols[code] || code + " ";
    return `${symbol}${amount.toFixed(2)}`;
  };

  const makeCurrencyBalance = (amount: number) => ({
    amount: amount,
    amount_formatted: formatAmount(amount, currencyCode),
    amount_converted: amount,
    amount_converted_formatted: formatAmount(amount, currencyCode),
    currency: {
      id: currencyId,
      code: currencyCode
    }
  });

  // Mock GET /api/wallet/balance
  context.route("**/api/wallet/balance**", async (route: Route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers()["origin"] || "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, content-type, accept, x-requested-with",
          "Access-Control-Allow-Credentials": "true"
        }
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Access-Control-Allow-Origin": request.headers()["origin"] || "*",
        "Access-Control-Allow-Credentials": "true"
      },
      body: JSON.stringify({
        status: "success",
        data: {
          total: {
            [currencyCode]: makeCurrencyBalance(ownedAmount)
          },
          negative_allowance: {
            [currencyCode]: makeCurrencyBalance(creditAmount)
          },
          online: {
            [currencyCode]: makeCurrencyBalance(ownedAmount)
          },
          offline: {
            [currencyCode]: makeCurrencyBalance(0)
          }
        }
      })
    });
  });
}
