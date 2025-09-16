// --- internal
import { useInvoice } from "../invoices";

// --- types
import type { UseInvoice } from "../invoices";

/**
 * Composable to manage a single order.
 * It provides methods to load and manage the state of an order.
 * This is an alias for useInvoice, as orders are a type of invoice.
 * @param {string} id - The ID of the order to load.
 * @return {UseInvoice} The order object with its state and methods.
 */
export const useOrder = (id: string): UseInvoice => useInvoice(id);
