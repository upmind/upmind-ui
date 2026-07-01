import dompurify from "dompurify";
import { marked } from "marked";
import type { VueMessageType } from "vue-i18n";

marked.use({ async: false, breaks: true });

export const markdownModifier = (str: VueMessageType) =>
  dompurify.sanitize(marked.parseInline(str as string) as string);
