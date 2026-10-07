// -----------------------------------------------------------------------------
/**
 * @fileoverview The Nuxt cart ships every translation file apps/cart ships.
 *
 * ## Job To Be Done
 * Each language the cart translates carries the same files in the Nuxt cart,
 * translation downloads land in the folder the Nuxt cart reads them from, and
 * the Nuxt cart never uploads source strings (only packages/i18n does).
 *
 * ## What Breaks If These Fail
 * Page titles and billing text show raw keys or English, because a file is
 * missing or a download went to a folder the app never reads; or a second
 * uploader overwrites the shared source strings.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { get, map, sortBy, toString } from "lodash-es";

const APP_ROOT = process.cwd();
const NUXT_LOCALES = join(APP_ROOT, "app/assets/locales");
const CART_LOCALES = resolve(APP_ROOT, "../cart/src/assets/locales");

const filesIn = (directory: string) => sortBy(readdirSync(directory));

const languages = filesIn(CART_LOCALES);

const localazyConfig = () =>
  JSON.parse(readFileSync(join(APP_ROOT, "localazy.json"), "utf8"));

describe("the Nuxt cart's translation files", () => {
  it("covers every language apps/cart translates", () => {
    expect(languages).not.toHaveLength(0);
    expect(filesIn(NUXT_LOCALES)).toEqual(languages);
  });

  it.each(map(languages, language => [language]))(
    "holds every %s file apps/cart holds",
    language => {
      expect(filesIn(join(NUXT_LOCALES, language))).toEqual(
        filesIn(join(CART_LOCALES, language))
      );
    }
  );

  it("downloads translations into the folder the app reads", () => {
    expect(
      resolve(APP_ROOT, toString(get(localazyConfig(), "download.folder")))
    ).toBe(NUXT_LOCALES);
  });

  it("never uploads source strings", () => {
    expect(localazyConfig()).not.toHaveProperty("upload");
  });
});
