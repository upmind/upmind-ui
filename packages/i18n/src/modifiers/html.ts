import dompurify from "dompurify";
import type { VueMessageType } from "vue-i18n";

export const htmlModifier = (str: VueMessageType) =>
  dompurify.sanitize(str as string, { ADD_ATTR: ["target"] });
