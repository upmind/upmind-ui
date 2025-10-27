// --- internal
import { useInvoice } from "../invoices";

// --- types
import type { UseInvoice } from "../invoices";

/**
 * Composable function to manage a single order.
 * This is an alias for useInvoice, as orders are considered a type of invoice in this context.
 * Provides access to the same data and methods as `useInvoice`.
 *
 * @param {string} id - The ID of the order to load.
 * @returns {@link UseInvoice} The order object, with its state and methods managed by `useInvoice`.
 */
export const useOrder = (id: string): UseInvoice => useInvoice(id);
