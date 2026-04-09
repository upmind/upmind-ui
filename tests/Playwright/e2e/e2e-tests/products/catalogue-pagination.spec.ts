import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { Pagination } from "../../support/page-objects/components/pagination";
let pagination: Pagination;

test.describe("Catalogue Pagination", () => {
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
    await page.goto(`${URLs.catalogueRoot1}?page=99`);
    await expect(page).toHaveURL(/page=5/);
  });
  test("Next button is disabled on last page", async ({ page }) => {
    await page.goto(`${URLs.catalogueRoot1}?page=5`);
    await page.waitForLoadState("networkidle");
    await expect(pagination.nextButton).toBeDisabled();
  });
  test("Previous button is disabled on first page", async ({ page }) => {
    await page.goto(URLs.catalogueRoot1);
    await page.waitForLoadState("networkidle");
    await expect(pagination.previousButton).toBeDisabled();
  });
});
