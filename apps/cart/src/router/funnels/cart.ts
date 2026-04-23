// --- internal
import services from "../services";
import actions from "../actions";
import guards from "../guards";

// --- types
import {
  type AnyEventObject,
  assign,
  type FunnelContext,
  type FunnelProps,
  QUERY_PARAMS,
  useBasket
} from "@upmind-automation/client-vue";
import { ROUTE } from "../types";
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
//   routes, and `resolveBidParams()` in actions.ts handles param injection via
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
      entry: ["setResolving", "setBasket"],
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
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardCatalogue",
        onDone: { actions: ["setResolved"] },
        onError: { target: ROUTE.BASKET, actions: ["setResolving"] }
      },
      on: {
        NEXT: {
          target: ROUTE.RECOMMENDATIONS,
          actions: [assign({ targetRoute: { name: ROUTE.RECOMMENDATIONS } })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
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
      entry: ["setResolving"],
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
      entry: ["setCurrency", "setBasket", "setProductConfigs"],
      invoke: {
        src: "guardProductConfigure",
        onDone: [
          {
            target: ROUTE.PRODUCT_RECOMMENDATIONS,
            actions: ["setResolving", "setTargetRoute"],
            cond: "isNext"
          },
          { actions: ["setResolved"] }
        ],
        onError: [
          {
            target: ROUTE.PRODUCT_NOT_FOUND,
            actions: ["setResolving", "setTargetRoute"],
            cond: "isProductNotFound"
          },
          { target: ROUTE.CHECKOUT_FLOW, actions: ["setResolving"] }
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
        },
        BACK: {
          target: ROUTE.CATALOGUE,
          actions: [assign({ targetRoute: { name: ROUTE.CATALOGUE } })]
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
      entry: ["setResolved"],
      on: {
        NEXT: {
          target: ROUTE.CHECKOUT_FLOW,
          actions: [assign({ targetRoute: { name: ROUTE.CHECKOUT_FLOW } })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
      }
    },

    /**
     * 🎯 ROUTE.PRODUCT_RECOMMENDATIONS
     * This state manages the product recommendations view.
     * It invokes a 'guard' to fetch and display recommendations based on the product ID (pid) from the route.
     * In case of an error (e.g., no recommendations available), it redirects to the CHECKOUT_FLOW route.
     */
    [ROUTE.PRODUCT_RECOMMENDATIONS]: {
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardProductRecommendations",
        onDone: { actions: ["setResolved"] },
        onError: { target: ROUTE.CHECKOUT_FLOW, actions: ["setResolving"] }
      },
      on: {
        NEXT: {
          target: ROUTE.CHECKOUT_FLOW,
          actions: [assign({ targetRoute: { name: ROUTE.CHECKOUT_FLOW } })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
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
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardBasket",
        onDone: { actions: ["setResolved"] },
        onError: [
          {
            target: ROUTE.SESSION_LOGIN,
            actions: [
              "setResolving",
              assign({
                targetRoute: (
                  _context: FunnelContext,
                  { data }: AnyEventObject
                ) => ({
                  name: ROUTE.SESSION_LOGIN,
                  params: data?.target?.params ?? {},
                  query: data?.target?.query ?? {}
                })
              })
            ],
            cond: "isSession"
          },
          {
            target: ROUTE.BASKET_EMPTY,
            actions: ["setResolving"]
          }
        ]
      },
      on: {
        NEXT: [
          {
            target: ROUTE.BILLING,
            actions: [
              "setResolving",
              assign({ targetRoute: { name: ROUTE.BILLING } })
            ],
            cond: "hasStandaloneBilling"
          },
          {
            target: ROUTE.CHECKOUT,
            actions: [assign({ targetRoute: { name: ROUTE.CHECKOUT } })]
          }
        ],
        BACK: {
          target: ROUTE.CATALOGUE,
          actions: [assign({ targetRoute: { name: ROUTE.CATALOGUE } })]
        }
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
      entry: ["setBasket"],
      invoke: {
        src: "guardBasket",
        onDone: { target: ROUTE.BASKET, actions: ["setResolving"] },
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.CATALOGUE,
          actions: [assign({ targetRoute: { name: ROUTE.CATALOGUE } })]
        },
        BACK: {
          target: ROUTE.CATALOGUE,
          actions: [assign({ targetRoute: { name: ROUTE.CATALOGUE } })]
        }
      }
    },

    /**
     * 🎯 ROUTE.BASKET_UNAVAILABLE
     * This state handles scenarios where the basket cannot be retrieved.
     * Resolves immediately — no guard needed since there is no basket to validate.
     * Users can return to the catalogue/storefront from here.
     */
    [ROUTE.BASKET_UNAVAILABLE]: {
      entry: ["setResolved"],
      on: {
        NEXT: {
          target: ROUTE.CATALOGUE,
          actions: [assign({ targetRoute: { name: ROUTE.CATALOGUE } })]
        },
        BACK: {
          target: ROUTE.CATALOGUE,
          actions: [assign({ targetRoute: { name: ROUTE.CATALOGUE } })]
        }
      }
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
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardProductEdit",
        onDone: { actions: ["setResolved"] },
        onError: ROUTE.BASKET
      },
      on: {
        NEXT: {
          target: ROUTE.RECOMMENDATIONS,
          actions: [assign({ targetRoute: { name: ROUTE.RECOMMENDATIONS } })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
      }
    },

    /**
     * 🎯 ROUTE.BASKET_PRODUCT_REQUIRES_ACTION
     * This state handles scenarios where a product in the basket requires additional user action.
     * It invokes a 'guard' to determine if any action is needed for the product.
     * If a related product (connected by serviceIdentifier) requires further action, it transitions to the BASKET_PRODUCT_EDIT route for that product.
     * eg: a Hosting product has a related Domain product that needs configuration
     * In case of an error, it redirects back to the BASKET route.
     */
    [ROUTE.BASKET_PRODUCT_REQUIRES_ACTION]: {
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardProductRequiresAction",
        onDone: { actions: ["setResolved"] },
        onError: [
          {
            target: ROUTE.BASKET_PRODUCT_EDIT,
            actions: ["setResolving", "setTargetRoute"],
            cond: "isBasketProductEdit"
          },
          { target: ROUTE.CHECKOUT_FLOW, actions: ["setResolving"] }
        ]
      },
      on: {
        NEXT: {
          target: ROUTE.BASKET_PRODUCT_EDIT,
          actions: [
            assign({ targetRoute: { name: ROUTE.BASKET_PRODUCT_EDIT } })
          ]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
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
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardRecommendations",
        onDone: { actions: ["setResolved"] },
        onError: ROUTE.CHECKOUT_FLOW
      },
      on: {
        NEXT: {
          target: ROUTE.CHECKOUT_FLOW,
          actions: [assign({ targetRoute: { name: ROUTE.CHECKOUT_FLOW } })]
        },
        BACK: {
          target: ROUTE.CHECKOUT_FLOW,
          actions: [assign({ targetRoute: { name: ROUTE.CHECKOUT_FLOW } })]
        }
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
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardDomains",
        onDone: { actions: ["setResolved"] },
        onError: ROUTE.RECOMMENDATIONS
      },
      on: {
        NEXT: {
          target: ROUTE.RECOMMENDATIONS,
          actions: [assign({ targetRoute: { name: ROUTE.RECOMMENDATIONS } })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
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
      entry: ["setCurrency", "setBasket"],
      invoke: {
        src: "guardDomains",
        onDone: { actions: ["setResolved"] },
        onError: {
          target: ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING,
          actions: ["setResolving"]
        }
      },
      on: {
        NEXT: {
          target: ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING,
          actions: [
            assign({
              targetRoute: { name: ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING }
            })
          ]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
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
      entry: ["setResolving"],
      invoke: {
        src: "processDomainsWithProduct",
        onDone: {
          target: ROUTE.RECOMMENDATIONS,
          actions: ["setResolving", "setTargetRoute"]
        },
        onError: [
          {
            target: ROUTE.BASKET_PRODUCT_EDIT,
            actions: ["setResolving", "setTargetRoute"],
            cond: "isBasketProductEdit"
          },
          {
            target: ROUTE.PRODUCT_CONFIGURE,
            actions: ["setResolving", "setTargetRoute"],
            cond: "isProductConfigure"
          },
          {
            target: ROUTE.CHECKOUT_FLOW,
            actions: ["setResolving", "setTargetRoute"]
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
      invoke: {
        src: "guardSession",
        onDone: { actions: ["setResolved"] },
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
     * When a bid is present, routes to BASKET after auth so `setTargetBasket`
     * loads the correct basket. Otherwise routes to CHECKOUT.
     * From here, users can proceed to the CHECKOUT route or return to the BASKET.
     */
    [ROUTE.SESSION_LOGIN]: {
      entry: ["setCurrency"],
      invoke: {
        src: "guardSession",
        onDone: [
          {
            target: ROUTE.CHECKOUT,
            actions: ["setResolving"],
            cond: "isSameRoute"
          },
          { actions: ["setResolved"] }
        ],
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_LOGIN,
          // NB: Preserve targetRoute (returnUrl) — only reset resolved flag.
          actions: [assign({ resolved: false })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_REGISTER
     * This state manages the registration process for new user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * When a bid is present, routes to BASKET after auth so `setTargetBasket`
     * loads the correct basket. Otherwise routes to CHECKOUT.
     * From here, users can proceed to the CHECKOUT route or return to the BASKET.
     */
    [ROUTE.SESSION_REGISTER]: {
      invoke: {
        src: "guardSession",
        onDone: [
          {
            target: ROUTE.CHECKOUT,
            actions: ["setResolving"],
            cond: "isSameRoute"
          },
          { actions: ["setResolved"] }
        ],
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_REGISTER,
          // NB: Preserve targetRoute (returnUrl) — only reset resolved flag.
          actions: [assign({ resolved: false })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
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
      invoke: {
        src: "guardSession",
        onDone: { actions: ["setResolved"] },
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_LOGIN,
          actions: [assign({ targetRoute: { name: ROUTE.SESSION_LOGIN } })]
        },
        BACK: {
          target: ROUTE.SESSION_LOGIN,
          actions: [assign({ targetRoute: { name: ROUTE.SESSION_LOGIN } })]
        }
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
      entry: ["setResolved"],
      invoke: {
        src: "guardSession",
        onDone: { actions: ["logout"] },
        onError: { actions: [] }
      },
      on: {
        NEXT: {
          target: ROUTE.CATALOGUE,
          actions: [assign({ targetRoute: { name: ROUTE.CATALOGUE } })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
      }
    },

    /**
     * 🎯 CHECKOUT_FLOW CHECK ** TRANSITIONAL STATE **
     *  It is called BEFORE we go to the "checkout" state and is governed by a BOS ( Brand Setting )
     * This state determines whether we should go to a one-page checkout or a stepped checkout process.
     */
    [ROUTE.CHECKOUT_FLOW]: {
      entry: "setResolving",
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
      entry: ["setCurrency", "setBasket", "setBillingDefaults"],
      invoke: {
        src: "guardCheckout",
        onDone: { actions: ["setResolved"] },
        onError: [
          {
            target: ROUTE.SESSION,
            actions: [
              assign({
                resolved: false,
                targetRoute: (
                  _context: FunnelContext,
                  { data }: AnyEventObject
                ) => ({
                  name: ROUTE.SESSION,
                  params: data?.target?.params ?? {},
                  query: data?.target?.query ?? {}
                })
              })
            ],
            cond: "isSession"
          },
          {
            target: ROUTE.BASKET_PRODUCT_REQUIRES_ACTION,
            actions: ["setResolving"],
            cond: "hasInvalidProducts"
          },
          {
            target: ROUTE.BILLING,
            actions: ["setResolving"],
            cond: "isBilling"
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
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
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
      entry: ["setCurrency"],
      invoke: {
        src: "guardBilling",
        onDone: [
          {
            target: ROUTE.CHECKOUT,
            actions: ["setResolving"],
            cond: "isCheckout"
          },
          { actions: ["setResolved"] }
        ],
        onError: [
          {
            target: ROUTE.CHECKOUT,
            actions: ["setResolving"],
            cond: "isSession"
          },
          { target: ROUTE.CHECKOUT, actions: ["setResolving"] }
        ]
      },
      on: {
        NEXT: [
          {
            target: ROUTE.CHECKOUT,
            actions: [assign({ targetRoute: { name: ROUTE.CHECKOUT } })]
          }
        ],
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
      }
    },

    /**
     * 🎯 ROUTE.DOMAIN_REGISTRANT_EDIT
     * This state manages the domain registrant details form.
     * Users fill in or edit registrant details for domain products in the basket.
     * Only accessible when the basket contains domain products.
     * On NEXT, transitions to the registrant review page.
     */
    [ROUTE.DOMAIN_REGISTRANT_EDIT]: {
      invoke: {
        src: "guardDomainRegistrantEdit",
        onDone: [
          {
            target: ROUTE.DOMAIN_REGISTRANT,
            actions: ["setResolving"],
            cond: "isRegistrantComplete"
          },
          { actions: ["setResolved"] }
        ],
        onError: { target: ROUTE.DOMAIN_REGISTRANT, actions: ["setResolving"] }
      },
      on: {
        NEXT: {
          target: ROUTE.DOMAIN_REGISTRANT,
          actions: [assign({ targetRoute: { name: ROUTE.DOMAIN_REGISTRANT } })]
        },
        BACK: {
          target: ROUTE.DOMAIN_REGISTRANT,
          actions: [assign({ targetRoute: { name: ROUTE.DOMAIN_REGISTRANT } })]
        }
      }
    },

    /**
     * 🎯 ROUTE.DOMAIN_REGISTRANT
     * This state manages the registrant details review page.
     * Shows all domain registrant statuses with completeness tracking.
     * If all domains are complete, the user can proceed to checkout.
     * If incomplete, the user is blocked until all domains have registrant data.
     */
    [ROUTE.DOMAIN_REGISTRANT]: {
      entry: ["setCurrency"],
      invoke: {
        src: "guardDomainRegistrant",
        onDone: { actions: ["setResolved"] },
        onError: { target: ROUTE.CHECKOUT, actions: ["setResolving"] }
      },
      on: {
        NEXT: {
          target: ROUTE.CHECKOUT,
          actions: [assign({ targetRoute: { name: ROUTE.CHECKOUT } })]
        },
        BACK: {
          target: ROUTE.BILLING,
          actions: [assign({ targetRoute: { name: ROUTE.BILLING } })]
        }
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
          actions: ["setResolving"]
        }
      }
      // type: "final"
    }
  },
  guards,
  services,
  actions
};
