import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { Pagination } from "../../support/page-objects/components/pagination";
import { waitForSessionCookie } from "../../support/helpers";

let pagination: Pagination;

test.describe("Catalogue Pagination", () => {
  // FE-2782 Category 3 (documented, unavoidable): the `?page=` query string IS
  // the deep-linkable pagination contract this suite exists to protect — the
  // component exposes no page-number testid, and users bookmark/share paginated
  // URLs. Asserting the query is asserting the behaviour, not a route-name shape.
  test.beforeEach(async ({ page }) => {
    pagination = new Pagination(page);
  });
  test("Navigate through catalogue pages", async ({ page }) => {
    await page.goto(URLs.catalogueRoot1);
    await pagination.clickNext();
    await expect(page).toHaveURL(/page=2/);
    await pagination.clickPrevious();
    await expect(page).toHaveURL(/page=1/);
  });
  test("Navigate to specific catalogue page with url query", async ({
    page
  }) => {
    await page.goto(`${URLs.catalogueRoot1}?page=3`);
    await expect(page).toHaveURL(/page=3/);
  });
  test("Navigating to non-existant page returns user to last page", async ({
    page
  }) => {
    await page.goto(`${URLs.catalogueRoot1}?page=999`);
    // App must redirect away from the OOB page number, and the landed page
    // must be a valid one — proven by the next button being disabled
    // (definition of "last page"). No magic numbers; behaviour-only.
    await expect(page).not.toHaveURL(/page=999\b/);
    await expect(page).toHaveURL(/[?&]page=\d+/);
    await expect(pagination.nextButton).toBeDisabled();
  });
  test("Next button is disabled on last page", async ({ page }) => {
    // Use the app's own out-of-bounds redirect as the canonical
    // "navigate to last page" mechanism (avoids staging-data coupling).
    await page.goto(`${URLs.catalogueRoot1}?page=999`);
    await waitForSessionCookie(page.context());
    await expect(pagination.nextButton).toBeDisabled();
  });
  test("Previous button is disabled on first page", async ({ page }) => {
    await page.goto(URLs.catalogueRoot1);
    await waitForSessionCookie(page.context());
    await expect(pagination.previousButton).toBeDisabled();
  });
});
