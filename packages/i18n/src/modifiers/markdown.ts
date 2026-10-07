import dompurify from "dompurify";
import { marked } from "marked";
import type { VueMessageType } from "vue-i18n";
// -----------------------------------------------------------------------------
/**
 * @module modifiers/markdown
 * @description The vue-i18n `markdown` modifier: renders a message as inline
 * markdown, then sanitises the HTML.
 */

marked.use({ async: false, breaks: true });

export const markdownModifier = (str: VueMessageType): string =>
  dompurify.sanitize(marked.parseInline(str as string) as string);
