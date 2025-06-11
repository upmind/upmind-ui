// --- internal
import { useBasket, useLocale } from "../..";
import packageJson from "../../../../package.json";

// --- utils
import { useCookies, usePOP, useTime } from "../../../utils";
import {
  isEmpty,
  isNil,
  omitBy,
  set,
  map,
  isArray,
  sumBy,
  some,
} from "lodash-es";

// --- types
import { IBasket, IInvoice } from "@upmind-automation/types";
import type { BasketProduct } from "../../basketProduct";
import type { Product } from "../../product";
import { mapIBasketProduct, mapBasketProduct } from "./utils";
import {
  DataLayerEcommerce,
  DataLayerEcommerceItems,
  DataLayerEcommerceItem,
  DataLayerPage,
  DataLayerUser,
} from "./types";
import { PageRoute } from "../../routing";

// -----------------------------------------------------------------------------
// ---  Globals/Singeltons
let UETQ: Window["uetq"]; // Microsoft Consent
let DATA_LAYER = window.dataLayer || [];

// -----------------------------------------------------------------------------

/**
 * Class to manage the tracking events.
 * @class TrackingEvent
 * @param {Object} args - The arguments to be passed to the tracking event.
 * @returns {Object} An object containing the tracking event.
 * @property {Object} args - The arguments to be passed to the tracking event.
 * @method withPage - Method to add page tracking to the event.
 * @method withEcommerce - Method to add ecommerce tracking to the event.
 * @method withUser - Method to add user tracking to the event.
 * @method push - Method to push the tracking event to the data layer.
 *
 * Method chaining is supported.
 *
 * @example
 * const trackingEvent = new TrackingEvent();
 * trackingEvent.withPage({to: "/checkout", from: "/basket"});
 * trackingEvent.withEcommerce();
 * trackingEvent.withUser();
 * trackingEvent.push();
 * @example
 * const trackingEvent = new TrackingEvent();
 * trackingEvent.withPage({to: "/checkout", from: "/basket"}).withEcommerce().withUser().push(false);
 */
class TrackingEvent {
  args: Record<string, any> = {};
  complete: boolean = false;

  constructor(args: Record<string, any> = {}) {
    this.args = args ?? {};
  }

  withPage(router?: PageRoute): TrackingEvent {
    const { locale } = useLocale();
    const { getPOP } = usePOP();

    const POP = getPOP();
    const version = packageJson?.version; // TODO: Come up with a relevant version number: which Pkg should provide this?

    const payload: DataLayerPage = omitBy(
      {
        page_type: router?.to?.name,
        environment: POP.name,
        version,
        language: locale.value?.toLocaleUpperCase(),
        current_url: router?.to?.fullPath,
        previous_url: router?.from?.fullPath,
      },
      isNil
    );

    set(this.args, "page", payload);
    return this; // nb this is needed to chain the methods
  }

  withUser(): TrackingEvent {
    const { get: getCookie } = useCookies();

    let payload = {};
    const storedActor = getCookie("upm_actor", value =>
      JSON.parse(atob(value))
    ) as DataLayerUser;

    if (!isEmpty(storedActor)) {
      payload = storedActor;
    } else {
      payload = {
        logged_in: false,
      };
    }

    set(this.args, "user", omitBy(payload, isNil));
    return this; // nb this is needed to chain the methods
  }

  withEcommerce(invoice?: IInvoice): TrackingEvent {
    const { basket } = useBasket();
    const safeBasket = invoice ?? basket.value;

    if (isEmpty(safeBasket)) {
      throw new Error("No Basket available");
    }
    // When a user submits their billing address
    const payload: DataLayerEcommerce = {
      currency: safeBasket.currency.code,
      value: safeBasket.net_amount, //TODO: check the correct value is used
      gross_value: safeBasket.total_amount, //TODO: check the correct value is used
      coupon: !isEmpty(safeBasket.promotions)
        ? map(safeBasket.promotions, "promotion.code").toString()
        : undefined,
      // --- invoice specific data
      transaction_id: safeBasket?.number,
      tax: safeBasket.tax_amount,
      purchase_type: invoice ? "new_purchase" : undefined,
      items: map(
        safeBasket.products,
        mapIBasketProduct
      ) as DataLayerEcommerceItem[],
    };

    set(this.args, "ecommerce", omitBy(payload, isNil));

    return this; // nb this is needed to chain the methods
  }

  /**
   * This is usually used when adding/updating/removing item(s) to/from the basket
   * Can be for a single item or multiple in the case of bulk add/remove
   * @param items : Can be either a Product(s) or a BasketProduct(s) and represent the item(s) being added/updated/removed
   */
  withItems(
    items: (Product | Product[]) | (BasketProduct | BasketProduct[])
  ): TrackingEvent {
    const safeItems = isArray(items) ? items : [items];

    if (isEmpty(safeItems)) {
      throw new Error("No Products available");
    }

    const { basket } = useBasket();
    if (isEmpty(basket)) throw new Error("No Basket available");

    // When a user submits their billing address
    const payload: DataLayerEcommerceItems = {
      currency: basket.value!.currency.code,
      value: sumBy(
        safeItems,
        ({ price }) =>
          price?.configuration?.subtotal ?? price.currentAmount ?? 0
      ),
      // Dont have the current values to be able to calculate this
      // gross_value: sumBy(safeItems, "price.configuration.total"),
      items: map(safeItems, mapBasketProduct) as DataLayerEcommerceItem[],
    };

    set(this.args, "ecommerce", omitBy(payload, isNil));

    return this; // nb this is needed to chain the methods
  }

  push(clear: boolean = true): Record<string, any> {
    const payload = this.args;

    if (clear) set(payload, "_clear", true);

    DATA_LAYER.push(payload);
    this.complete = true;
    return payload;
  }
}

// -----------------------------------------------------------------------------

/**
 * Composable for managing the data layer for tracking and analytics.
 *
 * @param {string} dataLayer - The name of the data layer to be used.
 * @returns {object} Grouped and documented returns for data layer management.
 */
export const useDataLayer = (dataLayer: string = "dataLayer") => {
  DATA_LAYER = (window.dataLayer =
    window.dataLayer || []) as Window["dataLayer"];
  UETQ = window["uetq"] = window["uetq"] || [];

  // --- state

  const id = dataLayer;

  function init(): Promise<void> {
    // ---  Init the consent manager
    DATA_LAYER.push([
      "consent",
      "default",
      {
        ad_personalization: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        analytics_storage: "denied",
        functionality_storage: "denied",
        personalization_storage: "denied",
        security_storage: "denied",
        wait_for_update: 500,
      },
    ]);

    UETQ.push("consent", "default", {
      ad_storage: "denied",
      wait_for_update: 500,
    });
    DATA_LAYER.push(["set", "ads_data_redaction", true]);
    DATA_LAYER.push(["set", "url_passthrough", false]);

    return Promise.resolve();
  }

  function dataLayerEvent(args: Record<string, any> = {}) {
    let event: TrackingEvent | null = new TrackingEvent(args);
    setTimeout(() => {
      if (event && !event?.complete) {
        console.warn(
          "Tracking event not pushed after 3 seconds. Pushing now...",
          event.args
        );
        event.push();
      }
      event = null;
    }, useTime().SECOND * 3);
    return event;
  }

  // ---------------------------------------------------------------------------

  return {
    // --- state
    /**
     * Initializes the data layer with default consent settings and initial push.
     * @returns {Promise<void>} Resolves when initialization is complete.
     */
    init,

    // --- context

    /**
     * The name/id of the data layer.
     */
    id,

    // --- methods

    /**
     * Creates a new tracking event for the data layer.
     * @param {Record<string, any>} args - Arguments for the tracking event.
     * @returns {TrackingEvent} The tracking event instance.
     */
    dataLayer: dataLayerEvent,
  };
};

/**
 * The return type of useBrand composable.
 */
export type UseDataLayer = ReturnType<typeof useDataLayer>;
