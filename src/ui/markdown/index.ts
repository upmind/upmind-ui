import { defineCustomElement } from "vue";
import Markdown from "./Markdown.ce.vue";

export { default as Markdown } from "./Markdown.ce.vue";

export const UpmMarkdown = defineCustomElement(Markdown);
