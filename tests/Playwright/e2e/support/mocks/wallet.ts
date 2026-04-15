import { BrowserContext, Route } from "@playwright/test";

/**
 * Mocks the wallet balance and cart/calculate API responses to simulate
 * a client with account credit at checkout. This allows tests to verify
 * the Account Credit UI without needing a real wallet balance.
 *
 * Intercepts:
 *  - GET /api/wallet/balance — returns a mocked IWalletBalance
 *  - POST /api/cart/calculate — returns a mocked total for the credit sum
 *
 * @param context - Browser context to register the routes on
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

  const totalAmount = ownedAmount + creditAmount;

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

  // Mock POST /api/cart/calculate
  context.route("**/api/cart/calculate**", async (route: Route) => {
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
          total: totalAmount,
          total_formatted: formatAmount(totalAmount, currencyCode),
          currency_id: currencyId
        }
      })
    });
  });
}
