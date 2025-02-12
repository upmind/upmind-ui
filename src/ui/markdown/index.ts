// --- external
import { defineCustomElement } from "vue";

// --- vue elements
export { default as Markdown } from "./Markdown.ce.vue";

// --- custom elements
import Markdown from "./Markdown.ce.vue";
export const UpmMarkdown = defineCustomElement(Markdown);
