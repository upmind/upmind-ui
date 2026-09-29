// -----------------------------------------------------------------------------
/**
 * @fileoverview The sign-in pages keep the arrangement and the parts their host
 * page hands them.
 *
 * ## Job To Be Done
 * A brand's chosen arrangement, and the basket summary beside the sign-in form,
 * reach the visitor now that the host page passes them in.
 *
 * ## What Breaks If These Fail
 * A host drops or mis-keys a template and the brand's arrangement never shows,
 * or the summary slot goes unfilled and a guest signs in blind to their basket.
 *
 * Implements `tests/features/login-registration/host-supplied-page-parts.feature`.
 */

import { expect, test } from "@playwright/test";
import type { Browser, Locator, Page } from "@playwright/test";

import { AUTH_APP_URL } from "../../../../../playwright.config";
import { URLs } from "../../support/constants/urls";
import { getBasketProductsViaHeadless } from "../../support/flows/basket-setup";
import { seedGuestBasket } from "../../support/flows/guest-checkout";
import { interceptUISchema } from "../../support/mocks/brand";
import { Login } from "../../support/page-objects/templates/login";

// -----------------------------------------------------------------------------

const ARRANGEMENT = {
  TWO_COLUMN: "two-column-ltr",
  MIRRORED_TWO_COLUMN: "two-column-rtl",
  SPLIT: "split",
  ENCLOSED: "enclosed"
} as const;

type Arrangement = (typeof ARRANGEMENT)[keyof typeof ARRANGEMENT];

const SCREEN = {
  SIGN_IN: "login",
  REGISTRATION: "register",
  RECOVERY: "recover"
} as const;

type Screen = (typeof SCREEN)[keyof typeof SCREEN];

const VISIBILITY = {
  VISIBLE: "visible",
  HIDDEN: "hidden"
} as const;

const VIEWPORT = { width: 1920, height: 1080 };

const PAGE_CENTRE = VIEWPORT.width / 2;

const HOSTS = [
  {
    name: "the cart",
    url: (screen: Screen) => `${URLs.baseUrl}order/auth/${screen}/`
  },
  {
    name: "the stand-alone sign-in app",
    url: (screen: Screen) => new URL(screen, AUTH_APP_URL).toString()
  }
];

const EXAMPLES: { screen: Screen; arrangement: Arrangement }[] = [
  { screen: SCREEN.SIGN_IN, arrangement: ARRANGEMENT.TWO_COLUMN },
  { screen: SCREEN.REGISTRATION, arrangement: ARRANGEMENT.SPLIT },
  { screen: SCREEN.RECOVERY, arrangement: ARRANGEMENT.ENCLOSED }
];

type Placement = { left: number; right: number; ancestry: string };

type Box = { x: number; width: number };

// -----------------------------------------------------------------------------

function sessionForm(page: Page, screen: Screen): Locator {
  return page
    .getByTestId("session-form")
    .and(page.locator(`[data-test-value="${screen}"]`));
}

async function boxOf(region: Locator): Promise<Box> {
  const box = await region.boundingBox();
  if (!box) throw new Error("the region has no box on the page");
  return box;
}

/** Where the form sits on the page, and the chain of boxes that frame it. */
async function placementOf(form: Locator): Promise<Placement> {
  const box = await boxOf(form);
  const ancestry = await form.evaluate(node => {
    const frames: string[] = [];
    for (let at = node.parentElement; at && at.id !== "app"; at = at.parentElement)
      frames.push(`${at.tagName}.${at.getAttribute("class") ?? ""}`);
    return frames.join(" < ");
  });
  return { left: box.x, right: box.x + box.width, ancestry };
}

async function openUnder(
  browser: Browser,
  url: string,
  screen: Screen,
  arrangement: Arrangement
): Promise<Placement> {
  const context = await browser.newContext({ viewport: VIEWPORT });
  try {
    interceptUISchema(context, { "@context.auth.template": arrangement });
    const page = await context.newPage();
    await page.goto(url);
    const form = sessionForm(page, screen);
    await expect(form).toBeVisible({ timeout: 30000 });
    return await placementOf(form);
  } finally {
    await context.close();
  }
}

// -----------------------------------------------------------------------------

test.describe("Pages keep their arrangement and their parts when the host app supplies them", () => {
  for (const host of HOSTS)
    for (const { screen, arrangement } of EXAMPLES)
      test(`The ${screen} page in ${host.name} shows in the "${arrangement}" arrangement`, async ({
        browser
      }) => {
        const url = host.url(screen);

        const chosen = await openUnder(browser, url, screen, arrangement);
        const mirrored = await openUnder(
          browser,
          url,
          screen,
          ARRANGEMENT.MIRRORED_TWO_COLUMN
        );

        expect(chosen.ancestry).not.toBe(mirrored.ancestry);
        expect(mirrored.left).toBeGreaterThanOrEqual(PAGE_CENTRE - 100);
        if (arrangement === ARRANGEMENT.TWO_COLUMN)
          expect((chosen.left + chosen.right) / 2).toBeLessThan(PAGE_CENTRE);
        if (arrangement === ARRANGEMENT.SPLIT)
          expect(chosen.right).toBeLessThanOrEqual(PAGE_CENTRE);
      });

  test.describe("the basket summary beside the sign-in form", () => {
    test.use({ viewport: VIEWPORT });

    test.afterEach(async ({ page }) => {
      await page.unrouteAll({ behavior: "wait" });
    });

    test("Guests see the basket summary beside the sign-in form", async ({
      page,
      context
    }) => {
      const login = new Login(page);
      interceptUISchema(context, {
        "@context.auth.basketSummary": VISIBILITY.VISIBLE
      });
      await seedGuestBasket(page);
      const inBasket = await getBasketProductsViaHeadless(page);

      await page.goto(URLs.login);
      await expect(login.loginForm).toBeVisible({ timeout: 30000 });

      await expect(login.basketSummary).toBeVisible({ timeout: 15000 });
      await expect(login.basketSummaryProducts).toHaveCount(inBasket.length);
      for (const product of inBasket)
        await expect(login.basketSummary).toContainText(String(product.name));
      const formBox = await boxOf(login.loginForm);
      const summaryBox = await boxOf(login.basketSummary);
      const summaryRightOfForm = summaryBox.x >= formBox.x + formBox.width;
      const summaryLeftOfForm = summaryBox.x + summaryBox.width <= formBox.x;
      expect(summaryRightOfForm || summaryLeftOfForm).toBe(true);
    });

    test("Guests see no basket summary where the brand hides it", async ({
      page,
      context
    }) => {
      const login = new Login(page);
      interceptUISchema(context, {
        "@context.auth.basketSummary": VISIBILITY.HIDDEN
      });
      await seedGuestBasket(page);

      await page.goto(URLs.login);
      await expect(login.loginForm).toBeVisible({ timeout: 30000 });

      await expect(login.basketSummary).toHaveCount(0);
    });
  });
});
