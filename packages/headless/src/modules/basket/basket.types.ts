import type { ResponseError } from "../../utils";
import type { BasketProduct } from "../basket-product";
import type { PaymentDetailData } from "../payment-details";
import type { IBasket, IInvoice, IWarningNote } from "@upmind-automation/types";
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------

/**
 * Interface representing the context for the main shopping basket, typically managed by an XState machine.
 * It holds the entire state of the basket, including its products, summary, errors, and references
 * to spawned child actors for managing related concerns like billing, currency, and promotions.
 */
export interface BasketContext {
  /**
   * Warning notes from the API, stored in context for banner display.
   * Only non-hidden notes are stored.
   */
  warningNotes?: IWarningNote[];
  /**
   * An optional target basket ID used to load a specific basket by ID via URL.
   * When set, the basket `load` service fetches `orders/{targetBasketId}` instead of `orders/current`.
   * Falls back to `orders/current` on 404 or completion errors.
   */
  targetBasketId?: string;
  /**
   * The raw `IBasket` object representing the current state of the shopping basket.
   */
  basket?: IBasket;
  /**
   * Sticky flag raised when an incoming basket introduces product changes,
   * before `updateBasket` poisons the comparison. Read by `refresh` to decide
   * whether to refetch provision-field values; cleared in `refresh.onDone`.
   */
  provisioningStale?: boolean;
  /**
   * The `IInvoice` object associated with the basket, if the basket has progressed to an invoice stage.
   */
  invoice?: IInvoice;
  // ---
  /**
   * An array of {@link BasketProduct} objects, representing all products currently in the basket.
   */
  products: BasketProduct[];
  // ---
  /**
   * An error object if any issue occurred during basket operations.
   */
  error?: ResponseError;

  /**
   * A summary object providing formatted details of the basket's financial breakdown.
   */
  summary?: {
    /**
     * The array of {@link BasketProduct} objects, usually a filtered or augmented version
     * of the main `products` array for summary display.
     */
    products: BasketProduct[];
    /**
     * The total discount amount applied to the basket, formatted as a string (e.g. "£10.00").
     */
    discount: string | null;
    /**
     * The subtotal amount of the basket (before taxes and after discounts), formatted as a string.
     */
    subtotal: string;
    /**
     * An array of tax details, each with a title (e.g. "VAT") and an amount, formatted as a string.
     */
    taxes: { title: string; amount: string }[];
    /**
     * The total amount due for the basket, formatted as a string.
     */
    total: string;
  };
  // --- SPAWNED ACTORS/MACHINES
  /**
   * A record of `ActorRef`s to various child actors (XState machines) spawned by the basket.
   * These actors manage specific aspects of the basket's functionality.
   */
  actors?: {
    /** `ActorRef` for the currency management state machine. */
    currency: ActorRef<any>;
    /** `ActorRef` for the custom fields state machine. */
    customFields: ActorRef<any>;
    /** `ActorRef` for the promotions state machine. */
    promotions: ActorRef<any>;
    // --- only when a basket is claimed
    paymentDetail?: ActorRef<any>;
    /** `ActorRef` for the billing-related state machine. */
    billing?: ActorRef<any>;
  };
  /**
   * An `ActorRef` to an authentication helper service for managing session-related concerns.
   */
  authHelper?: ActorRef<any>;
  /**
   * An `ActorRef` to a helper that can send RESET back to the basket machine from deferred callbacks.
   */
  resetHelper?: ActorRef<any>;
  /**
   * An `ActorRef` to the payment state machine, managing the overall payment process.
   */
  payment?: ActorRef<any>;
  attempts?: number;
  // --- Payment
  paymentDetail?: PaymentDetailData;
}
