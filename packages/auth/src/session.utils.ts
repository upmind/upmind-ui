import { computed, type Ref } from "vue";
import { SESSION_TEMPLATE } from "./types";

const INACTIVE_SECTION_TEMPLATES: SESSION_TEMPLATE[] = [
  SESSION_TEMPLATE.SPLIT,
  SESSION_TEMPLATE.CANVAS_CARD,
  SESSION_TEMPLATE.SURFACE_BOX
];

/**
 * Whether the guest-checkout offer is shown. `canRegisterAsGuest` is the brand
 * toggle alone and carries no authentication term, so without `isAuthenticated`
 * the offer reaches a visitor who already holds a session.
 */
export function offersGuestCheckout(terms: {
  isAuthenticated: boolean;
  canRegisterAsGuest: boolean;
  isBasketLoading: boolean;
  hasRecurringProducts: boolean;
}): boolean {
  const isAnonymous = !terms.isAuthenticated;
  const brandAllows = terms.canRegisterAsGuest;
  const basketSettled = !terms.isBasketLoading;
  const isOneOffBasket = !terms.hasRecurringProducts;

  return isAnonymous && brandAllows && basketSettled && isOneOffBasket;
}

export function useSessionTemplates(template: Ref<SESSION_TEMPLATE>) {
  const meta = computed(() => ({
    hasActiveSection: !INACTIVE_SECTION_TEMPLATES.includes(template.value),
    hasMarkdownSlot: INACTIVE_SECTION_TEMPLATES.includes(template.value),
    isSplit: template.value === SESSION_TEMPLATE.SPLIT
  }));

  return { meta };
}
