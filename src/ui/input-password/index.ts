// -----------------------------------------------------------------------------
/**
 * @module input-password
 * @description Password input primitive (`InputPassword`) and its presentational
 * strength meter (`PasswordStrength`). Requirements-driven scoring, error-key
 * resolution, and cryptographically-random generation live in `utils/password`.
 */

// --- external
import { defineCustomElement } from "vue";
// --- components
import InputPassword from "./InputPassword.ce.vue";
import PasswordStrength from "./PasswordStrength.vue";
// ---
export { InputPassword, PasswordStrength };
export type { InputPasswordProps, PasswordStrengthProps } from "./types";
// --- custom element
export const UpmInputPassword = defineCustomElement(InputPassword);
