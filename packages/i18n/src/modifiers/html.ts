import dompurify from "dompurify";
import type { VueMessageType } from "vue-i18n";
// -----------------------------------------------------------------------------
/**
 * @module modifiers/html
 * @description The vue-i18n `html` modifier: sanitises a message as HTML,
 * keeping the `target` attribute on links.
 */

export const htmlModifier = (str: VueMessageType): string =>
  dompurify.sanitize(str as string, { ADD_ATTR: ["target"] });
