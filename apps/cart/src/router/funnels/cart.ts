// --- internal
import services from "./engine/services";
import actions from "./engine/actions";
import guards from "./engine/guards";

// --- types
import {
  type AnyEventObject,
  assign,
  type FunnelContext,
  type FunnelProps,
  QUERY_PARAMS,
  useBasket
} from "@upmind-automation/client-vue";
import { ROUTE } from "./types";
// Note: useBasket and QUERY_PARAMS are still used by the CHECKOUT NEXT handler.

// -----------------------------------------------------------------------------
// BID PRESERVATION:
//   Basket routes use `/order/basket/:bid?/...` with an optional `:bid` param.
//   Other routes use a BID_PREFIX `:segment(basket)?/:bid?` so URLs render
//   as `/order/basket/{bid}/...` when a bid is active, or `/order/...` when not.
//
//   Bid injection is handled holistically by the `setResolved` override
//   in `actions.ts`. When any state resolves, `setResolved` reads
//   `targetBasketId` from the basket composable and auto-injects bid params.
//   For basket routes it injects `{ bid }` only; for BID_PREFIX routes it
//   injects `{ segment: 'basket', bid }`.
//
//   Guard services no longer need to manually inject bid params — the
//   `ensureBidAuth()` helper in services.ts handles auth-gating for bid
//   routes, and `injectBid()` in actions.ts handles param injection via
//   the `setResolved` override.
// -----------------------------------------------------------------------------

export default <FunnelProps>{
  id: "cart",
  states: {
    /**
     * 🎯 ROUTE.LOADING ** TRANSITIONAL STATE **
     * This is the initial loading state of the funnel.
     * It sets up the necessary context by setting the currency and product configurations.
     * Depending on whether product configurations are present,
     * it transitions to either the PRODUCT route (if configurations exist)
     * or the CATALOGUE route (if no configurations are found).
     */
    [ROUTE.LOADING]: {
      entry: ["setUnresolved", "clearTarget", "setBasket"],
      always: [
        {
          target: ROUTE.PRODUCT_CONFIGURE,
          cond: "hasProductConfigs"
        },
        {
          target: ROUTE.BASKET,
          cond: "hasBid"
        },
        {
          target: ROUTE.CATALOGUE
        }
      ]
    },

    /**
     * 🎯 ROUTE.CATALOGUE
     * This state manages the catalogue view of the application.
     * A 'guard' is invoked to ensure that the catalogue is enabled for the brand.
     * In case of an error, it redirects to the BASKET route.
     */
    [ROUTE.CATALOGUE]: {
      meta: { next: ROUTE.RECOMMENDATIONS, prev: ROUTE.BASKET },
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardCatalogue",
        onDone: { actions: ["setResolved"] },
        onError: {
          target: ROUTE.BASKET,
          actions: ["setUnresolved", "clearTarget"]
        }
      }
    },

    /**
     * 🎯 ROUTE.PRODUCT ** TRANSITIONAL STATE **
     * This state serves as a routing hub for product-related actions.
     * It checks for the presence of product configurations in the route.
     * If configurations are found, it transitions to the PRODUCT_CONFIGURE route to handle product addition.
     * If no configurations are present, it redirects to the BASKET route.
     */
    [ROUTE.PRODUCT]: {
      entry: ["setUnresolved", "clearTarget"],
      always: [
        {
          target: ROUTE.PRODUCT_CONFIGURE,
          cond: "hasProductConfigs"
        },
        { target: ROUTE.CHECKOUT_FLOW }
      ]
    },

    /**
     * 🎯 ROUTE.PRODUCT_CONFIGURE
     * This state is responsible for adding a product to the basket.
     * It invokes a 'guard' to validate and add the product based on the current route's query parameters.
     * If the product is a valid product thats awaiting confirmation, it remains in this state until the product is confirmed.
     * In case of an error, it conditionally navigates to either the PRODUCT_NOT_FOUND route
     * (if a product ID is present) or back to the BASKET route.
     */
    [ROUTE.PRODUCT_CONFIGURE]: {
      meta: { prev: ROUTE.CATALOGUE },
      entry: ["setCurrency", "setBasket", "setProductConfigs"],
      invoke: {
        src: "guardProductConfigure",
        onDone: [
          {
            target: ROUTE.CATALOGUE,
            actions: ["setResolving", "setTargetRoute"],
            cond: "isCatalogue"
          },
          {
            target: ROUTE.PRODUCT_RECOMMENDATIONS,
            actions: ["setUnresolved", "setTargetRoute"],
            cond: "isNext"
          },
          { actions: ["setResolved"] }
        ],
        onError: [
          {
            target: ROUTE.PRODUCT_NOT_FOUND,
            actions: ["setUnresolved", "setTargetRoute"],
            cond: "isProductNotFound"
          },
          {
            target: ROUTE.CHECKOUT_FLOW,
            actions: ["setUnresolved", "clearTarget"]
          }
        ]
      },
      on: {
        NEXT: {
          target: ROUTE.PRODUCT_RECOMMENDATIONS,
          actions: [
            assign({
              targetRoute: (
                { targetRoute }: FunnelContext,
                { data }: AnyEventObject
              ) => ({
                name: ROUTE.PRODUCT_RECOMMENDATIONS,
                params: data?.targetRoute?.params ?? targetRoute?.params ?? {}
              })
            })
          ]
        }
      }
    },

    /**
     * 🎯 ROUTE.PRODUCT_NOT_FOUND
     * This state handles scenarios where a requested product cannot be found.
     * Upon entering this state, it sets the product ID (pid) in the route parameters
     * and marks the state as resolved.
     * From here, users can navigate back to the BASKET route .
     */
    [ROUTE.PRODUCT_NOT_FOUND]: {
      meta: { next: ROUTE.CHECKOUT_FLOW, prev: ROUTE.BASKET },
      entry: ["setResolved"]
    },

    /**
     * 🎯 ROUTE.PRODUCT_RECOMMENDATIONS
     * This state manages the product recommendations view.
     * It invokes a 'guard' to fetch and display recommendations based on the product ID (pid) from the route.
     * In case of an error (e.g., no recommendations available), it redirects to the CHECKOUT_FLOW route.
     */
    [ROUTE.PRODUCT_RECOMMENDATIONS]: {
      meta: { next: ROUTE.CHECKOUT_FLOW, prev: ROUTE.BASKET },
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardProductRecommendations",
        onDone: { actions: ["setResolved"] },
        onError: {
          target: ROUTE.CHECKOUT_FLOW,
          actions: ["setUnresolved", "clearTarget"]
        }
      }
    },

    /**
     * 🎯 ROUTE.BASKET
     * This state manages the basket view of the application.
     * When a bid (basket ID) is present in the route, the guard:
     *   1. Checks the user is authenticated (redirects to SESSION if not).
     *   2. Sets the target basket ID so the basket machine loads `orders/{bid}`.
     *   3. Falls back to current basket if the bid is invalid/expired.
     * When no bid, the guard checks the current basket has products.
     * In case of an error (e.g., empty basket), it redirects to the EMPTY route.
     * From here, users can proceed to the CHECKOUT route or return to the CATALOGUE.
     */
    [ROUTE.BASKET]: {
      meta: {
        next: [
          { target: ROUTE.BILLING, cond: "needsAddress" },
          { target: ROUTE.BASKET_PRODUCTS_SETUP, cond: "hasInvalidProducts" },
          { target: ROUTE.CHECKOUT }
        ],
        prev: ROUTE.CATALOGUE
      },
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardBasket",
        onDone: { actions: ["setResolved"] },
        onError: [
          {
            target: ROUTE.SESSION_LOGIN,
            actions: [
              "setUnresolved",
              assign({
                targetRoute: (
                  { currentRoute }: FunnelContext,
                  { data }: AnyEventObject
                ) => ({
                  name: `${String(currentRoute?.name ?? ROUTE.BASKET)}--auth`,
                  query: {
                    mode: "login",
                    [QUERY_PARAMS.CANCEL_URL]: ROUTE.CATALOGUE,
                    ...data?.target?.query
                  }
                })
              })
            ],
            cond: "isSession"
          },
          {
            target: ROUTE.BASKET_EMPTY,
            actions: ["setUnresolved", "clearTarget"]
          }
        ]
      }
    },

    /**
     * 🎯 ROUTE.BASKET_EMPTY
     * This state manages scenarios where the basket is empty.
     * It invokes a 'guard' to check the basket's contents.
     * If the basket has products, it transitions to the BASKET route.
     * If the basket remains empty, it marks the state as resolved.
     * Users can navigate to the CATALOGUE route from here to continue shopping.
     */
    [ROUTE.BASKET_EMPTY]: {
      meta: { next: ROUTE.CATALOGUE, prev: ROUTE.CATALOGUE },
      entry: ["setBasket"],
      invoke: {
        src: "guardBasket",
        onDone: {
          target: ROUTE.BASKET,
          actions: ["setUnresolved", "clearTarget"]
        },
        onError: { actions: ["setResolved"] }
      }
    },

    /**
     * 🎯 ROUTE.BASKET_UNAVAILABLE
     * This state handles scenarios where the basket cannot be retrieved.
     * Resolves immediately — no guard needed since there is no basket to validate.
     * Users can return to the catalogue/storefront from here.
     */
    [ROUTE.BASKET_UNAVAILABLE]: {
      meta: { next: ROUTE.CATALOGUE, prev: ROUTE.CATALOGUE },
      entry: ["setResolved"]
    },

    /**
     * 🎯 ROUTE.BASKET_PRODUCT_EDIT
     * This state manages the editing of a product already in the basket.
     * It invokes a 'guard' to validate the product based on the basket product ID (bpid) from the route.
     * In case of an error, it redirects back to the BASKET route.
     * From here, users can either proceed to the PRODUCT_RECOMMENDATIONS route
     * (if further action is required on a related  product)
     * or return to the BASKET.
     */
    [ROUTE.BASKET_PRODUCT_EDIT]: {
      meta: { next: ROUTE.RECOMMENDATIONS, prev: ROUTE.BASKET },
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardProductEdit",
        onDone: { actions: ["setResolved"] },
        onError: ROUTE.BASKET
      }
    },

    /**
     * 🎯 ROUTE.BASKET_PRODUCTS_SETUP
     * This state handles the product setup flow where products require additional configuration.
     * Shows ONE product at a time with only the fields that have errors or need input.
     * The page internally determines which product to configure via getNextRequiringSetup().
     * On NEXT (after all products configured), proceeds to checkout.
     * In case of an error (no products need setup), it redirects to checkout.
     */
    [ROUTE.BASKET_PRODUCTS_SETUP]: {
      meta: { next: ROUTE.CHECKOUT, prev: ROUTE.BASKET },
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardProductSetup",
        onDone: { actions: ["setResolved"] },
        onError: { target: ROUTE.CHECKOUT, actions: ["setResolving"] }
      }
    },

    /**
     * 🎯 ROUTE.RECOMMENDATIONS
     * This state manages general product recommendations view.
     * It invokes a 'guard' to fetch and display recommendations.
     * In case of an error (e.g., no recommendations available), it redirects to the CHECKOUT_FLOW route.
     * From here, users can either proceed to the CHECKOUT_FLOW route
     * or return to the BASKET.
     */
    [ROUTE.RECOMMENDATIONS]: {
      meta: { next: ROUTE.CHECKOUT_FLOW, prev: ROUTE.CHECKOUT_FLOW },
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardRecommendations",
        onDone: { actions: ["setResolved"] },
        onError: ROUTE.CHECKOUT_FLOW
      }
    },

    /**
     * 🎯 ROUTE.DOMAINS
     * This state manages the domain selection and registration process.
     * It sets the currency and marks the state as resolving upon entry.
     * From here, users can either proceed to the BASKET RECOMMENDATIONS route
     * or return to the BASKET.
     */
    [ROUTE.DOMAINS]: {
      meta: { next: ROUTE.RECOMMENDATIONS, prev: ROUTE.BASKET },
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardDomains",
        onDone: { actions: ["setResolved"] },
        onError: ROUTE.RECOMMENDATIONS
      }
    },

    /**
     * 🎯 ROUTE.DOMAINS_WITH_PRODUCT
     * This state handles domain selection and registration when associated with a specific product.
     * It sets the currency and marks the state as resolving upon entry.
     * It invokes a 'guard' to manage domain-related logic.
     * In case of an error during domain handling, it transitions to the DOMAINS_PROVISIONING state.
     * From here, users can either proceed to the DOMAINS_PROVISIONING state
     * or return to the 'complete' state to finalize the funnel.
     */
    [ROUTE.DOMAINS_WITH_PRODUCT]: {
      meta: { next: ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING, prev: ROUTE.BASKET },
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardDomains",
        onDone: { actions: ["setResolved"] },
        onError: {
          target: ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING,
          actions: ["setUnresolved", "clearTarget"]
        }
      }
    },

    /**
     * 🎯 ROUTE_DOMAINS_PROVISIONING ** TRANSITIONAL STATE **
     * This is called AFTER we exit the DOMAINS state.
     * This state handles the processing of domain provisioning for any related product from the funnel.
     * Upon successful processing, it transitions to the 'complete' state, allowing the funnel to finalize the navigation.
     * If an error occurs during processing, it conditionally navigates to the PRODUCT_CONFIGURE route
     * if further configuration is needed.
     */
    [ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING]: {
      entry: ["setUnresolved", "clearTarget"],
      invoke: {
        src: "processDomainsWithProduct",
        onDone: {
          target: ROUTE.RECOMMENDATIONS,
          actions: ["setUnresolved", "setTargetRoute"]
        },
        onError: [
          {
            target: ROUTE.BASKET_PRODUCT_EDIT,
            actions: ["setUnresolved", "setTargetRoute"],
            cond: "isBasketProductEdit"
          },
          {
            target: ROUTE.PRODUCT_CONFIGURE,
            actions: ["setUnresolved", "setTargetRoute"],
            cond: "isProductConfigure"
          },
          {
            target: ROUTE.CHECKOUT_FLOW,
            actions: ["setUnresolved", "setTargetRoute"]
          }
        ]
      }
    },

    /**
     * 🎯 ROUTE.SESSION
     * This state serves as a routing hub for session-related actions.
     * It always transitions to the SESSION_REGISTER route to handle user registration as the default action.
     */
    [ROUTE.SESSION]: {
      always: [
        {
          target: ROUTE.CHECKOUT_FLOW,
          actions: ["setUnresolved", "clearTarget"],
          cond: "isAuthenticated"
        }
      ],
      invoke: {
        src: "guardSession",
        onDone: [
          {
            target: ROUTE.CHECKOUT_FLOW,
            actions: ["setUnresolved", "clearTarget"],
            cond: "isSameRoute"
          },
          { actions: ["setResolved"] }
        ],
        onError: {
          target: ROUTE.SESSION_REGISTER,
          // NB: Preserve targetRoute query (returnUrl) but update route name
          // to SESSION_LOGIN so Vue Router navigates to /auth/login, not /auth.
          // Using inline assign instead of "setResolving" which clears targetRoute.
          actions: [
            assign({
              resolved: false,
              targetRoute: ({ targetRoute }: FunnelContext) => ({
                ...targetRoute,
                name: ROUTE.SESSION_REGISTER
              })
            })
          ]
        }
        // BRAND SETTING TO DECIDE DEFAULT SESSION ROUTE
      }
    },

    /**
     * 🎯 ROUTE.SESSION_LOGIN
     * This state manages the login process for user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * When a returnUrl is present, resolves to that URL after auth.
     * When a bid is present, routes to BASKET after auth so `setTargetBasket`
     * loads the correct basket. Otherwise routes to CHECKOUT.
     * From here, users can proceed to the CHECKOUT route or return to the BASKET.
     */
    [ROUTE.SESSION_LOGIN]: {
      meta: {
        next: [
          { target: ROUTE.REDIRECT, cond: "hasReturnUrl" },
          { target: ROUTE.CHECKOUT_FLOW }
        ],
        prev: ROUTE.BASKET
      },
      entry: ["setCurrency"],
      invoke: {
        src: "guardSession",
        onDone: [
          {
            target: ROUTE.CHECKOUT,
            actions: ["setUnresolved", "clearTarget"],
            cond: "isSameRoute"
          },
          { actions: ["setResolved"] }
        ],
        onError: { actions: ["setResolved"] }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_REGISTER
     * This state manages the registration process for new user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * When a returnUrl is present, resolves to that URL after auth.
     * When a bid is present, routes to BASKET after auth so `setTargetBasket`
     * loads the correct basket. Otherwise routes to CHECKOUT.
     * From here, users can proceed to the CHECKOUT route or return to the BASKET.
     */
    [ROUTE.SESSION_REGISTER]: {
      meta: {
        next: [
          { target: ROUTE.REDIRECT, cond: "hasReturnUrl" },
          { target: ROUTE.CHECKOUT_FLOW }
        ],
        prev: ROUTE.BASKET
      },
      invoke: {
        src: "guardSession",
        onDone: [
          {
            target: ROUTE.CHECKOUT,
            actions: ["setUnresolved", "clearTarget"],
            cond: "isSameRoute"
          },
          { actions: ["setResolved"] }
        ],
        onError: { actions: ["setResolved"] }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_RECOVER_PASSWORD
     * This state manages the password recovery process for user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * If the user is authenticated, it redirects to the BASKET route.
     * From here, users can navigate to the SESSION_LOGIN route to log in after recovering their password.
     */
    [ROUTE.SESSION_RECOVER_PASSWORD]: {
      meta: { next: ROUTE.SESSION_LOGIN, prev: ROUTE.SESSION_LOGIN },
      always: [
        {
          target: ROUTE.CHECKOUT_FLOW,
          actions: ["setUnresolved", "clearTarget"],
          cond: "isAuthenticated"
        }
      ],
      invoke: {
        src: "guardSession",
        onDone: [
          {
            target: ROUTE.CHECKOUT_FLOW,
            actions: ["setUnresolved", "clearTarget"],
            cond: "isSameRoute"
          },
          { actions: ["setResolved"] }
        ],
        onError: { actions: ["setResolved"] }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_END
     * This state manages the logout process for user sessions.
     * It invokes a 'guard' to handle session termination.
     * Upon successful logout, it redirects to the CATALOGUE route.
     * From here, users can navigate to the CATALOGUE to continue browsing
     * or return to the BASKET if needed.
     */
    [ROUTE.SESSION_END]: {
      meta: { next: ROUTE.CATALOGUE, prev: ROUTE.BASKET },
      entry: ["setResolved"],
      invoke: {
        src: "guardSession",
        onDone: { actions: ["logout"] },
        onError: { actions: [] }
      }
    },

    /**
     * 🎯 CHECKOUT_FLOW CHECK ** TRANSITIONAL STATE **
     *  It is called BEFORE we go to the "checkout" state and is governed by a BOS ( Brand Setting )
     * This state determines whether we should go to a one-page checkout or a stepped checkout process.
     */
    [ROUTE.CHECKOUT_FLOW]: {
      entry: ["setUnresolved", "clearTarget"],
      invoke: {
        src: "guardCheckoutFlow",
        onDone: [
          { target: ROUTE.BASKET, cond: "isBasket" },
          { target: ROUTE.CHECKOUT, cond: "isCheckout" }
        ],
        onError: ROUTE.BASKET // FAILSAFE
      }
    },
    /**
     * 🎯 ROUTE.CHECKOUT
     * This state manages the checkout process of the application.
     * It invokes a 'guard' to validate that the basket is ready for checkout,
     * ensuring it has products and meets any necessary conditions (e.g., authentication, required fields).
     * In case of an error, it redirects back to the BASKET route.
     * From here, users can proceed to the ORDER route to view the status of their order
     * or return to the BASKET to make changes.
     */
    [ROUTE.CHECKOUT]: {
      meta: { prev: ROUTE.BASKET },
      entry: ["setCurrency", "setBasket", "setBillingDefaults"],
      invoke: {
        src: "guardCheckout",
        onDone: { actions: ["setResolved"] },
        onError: [
          {
            target: ROUTE.SESSION,
            actions: [
              "setUnresolved",
              assign({
                targetRoute: (
                  { currentRoute }: FunnelContext,
                  { data }: AnyEventObject
                ) => ({
                  name: `${String(currentRoute?.name ?? ROUTE.CHECKOUT)}--auth`,
                  query: {
                    mode: "login",
                    ...data?.target?.query
                  }
                })
              })
            ],
            cond: "isSession"
          },
          {
            target: ROUTE.BILLING,
            actions: ["setUnresolved", "clearTarget"],
            cond: "isBilling"
          },
          {
            target: ROUTE.BASKET_PRODUCTS_SETUP,
            actions: ["setResolving"],
            cond: "hasInvalidProducts"
          },
          { target: ROUTE.BASKET, actions: ["setResolving"] }
        ]
      },
      on: {
        NEXT: {
          // When coming from checkout, we pull the OID from the event data
          // passed by the checkout completion action
          target: ROUTE.ORDER,
          actions: [
            assign({
              targetRoute: (
                _context: FunnelContext,
                { data }: AnyEventObject
              ) => {
                const { meta } = useBasket();
                const oid = data?.event?.id;
                return {
                  name: ROUTE.ORDER,
                  params: { oid },
                  query: {
                    [QUERY_PARAMS.PAYMENT_SUCCESS]:
                      meta.value.hasPaid.toString()
                  }
                };
              }
            })
          ]
        }
      }
    },

    /**
     * 🎯 ROUTE.BILLING
     * This state manages the standalone billing details page.
     * If billing is already satisfied, guardBilling resolves with target CHECKOUT
     * and the onDone isCheckout guard transitions the machine to CHECKOUT state,
     * skipping the billing page entirely.
     * If user input is needed, the page renders and Billing.vue auto-navigates
     * to checkout via NEXT when billing completes.
     * Users can also return to BASKET via BACK.
     */
    [ROUTE.BILLING]: {
      meta: {
        next: [
          { target: ROUTE.BASKET_PRODUCTS_SETUP, cond: "hasInvalidProducts" },
          { target: ROUTE.CHECKOUT }
        ],
        prev: ROUTE.BASKET
      },
      entry: ["setCurrency"],
      invoke: {
        src: "guardBilling",
        onDone: [
          {
            target: ROUTE.CHECKOUT,
            actions: ["setUnresolved", "clearTarget"],
            cond: "isCheckout"
          },
          { actions: ["setResolved"] }
        ],
        onError: [
          {
            target: ROUTE.CHECKOUT,
            actions: ["setUnresolved", "clearTarget"],
            cond: "isSession"
          },
          { target: ROUTE.CHECKOUT, actions: ["setUnresolved", "clearTarget"] }
        ]
      }
    },

    /** 🎯 ROUTE.ORDER
     * This is the final state of the funnel, representing the order completion stage.
     */
    [ROUTE.ORDER]: {
      invoke: {
        src: "guardSession",
        onDone: { actions: ["setResolved"] },
        onError: {
          target: ROUTE.SESSION_END,
          actions: ["setUnresolved", "clearTarget"]
        }
      }
      // type: "final"
    }
  },
  guards,
  services,
  actions
};
