/** @internal */
// -----------------------------------------------------------------------------
import { map, castArray } from "lodash-es";
import type { CustomPage } from "./client-custom-pages.types";
import type { ICustomPage } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/client-custom-pages.mappers
 * @description Wire ↔ view-model shaping only, shared by both doors. No side
 * effects, no HTTP. Never earns an actor arm: every in-scope actor reads the
 * same wire shape (`arms.services: none`).
 */

export const mapCustomPages = (
  raw: ICustomPage | ICustomPage[]
): CustomPage[] => map(castArray(raw), mapCustomPage);

export const mapCustomPage = (raw: ICustomPage): CustomPage => ({
  id: raw.id,
  brandId: raw.brand_id,
  name: raw.name,
  slug: raw.slug,
  // `||`, not `??` (AC7/O26/O30): `*_translated` is a non-nullable wire string
  // that is EMPTY, not absent, when no translation exists — the legacy
  // fallback (`loggedIn/index.vue:94`, `views/client/custom/index.vue:25`)
  // falls back on an empty string too, which `??` would not catch.
  title: raw.title_translated || raw.title,
  menuLabel: raw.menu_label_translated || raw.menu_label,
  showOnMenu: raw.show_on_menu
});
