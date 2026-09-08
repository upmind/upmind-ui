/**
 * @module foundation/section
 * @description The shared section wrapper and the section-config store every
 * page template writes to (ADR 023 §2 — ≥2 domains, knows none of them).
 */

export { default as Section } from "./Section.vue";
export { default as Sections } from "./Sections.vue";
export { useSection } from "./useSection";
export * from "./types";
export * from "./variants";
