import { Page } from "@playwright/test";

export async function setLocale(page: Page, value: string = "en") {
  await page.evaluate(localeValue => {
    localStorage.setItem("i18n/locale", localeValue);
  }, value);
  await page.reload();
}
