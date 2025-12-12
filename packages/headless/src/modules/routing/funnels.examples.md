export const defaultFunnelConfig = {
id: "cms_main_flow", // ID determined by CMS/Registration
initialState: "productPage",

states: {
productPage: {
on: {
NEXT: { target: "basket", cond: "hasBasketItems" }
}
},
basket: {
on: {
NEXT: [
{ target: "checkout", cond: "isAuthenticated" },
{ target: "login", target: "checkout", cond: "hasBasketItems" }
],
BACK: "productPage"
}
},
checkout: {
on: {
NEXT: "COMPLETED"
}
},
login: {
/_..._/
},

    // 🎯 Completion State: Falls back to the configured default
    COMPLETED: {
      type: "final",
      data: {
        resolvedRoute: context => context.currentRoute
        // nextFunnelId is omitted, triggering parent fallback to context.defaultFunnelId
      }
    }

},

guards: {
isAuthenticated: () => true,
hasBasketItems: () => true
},
services: {
// e.g. resolveStandardRoute: resolveStandardRoute
}
};

// --- 3. Web Hosting Funnel Configuration (webHostingFunnelConfig.js) ---

export const webHostingFunnelConfig = {
id: "webHosting",
initialState: "domainSelection",

statesConfig: {
domainSelection: {
on: {
NEXT: [
{ target: "cartUpsell", cond: "isValidDomainSelection" },
{ target: "domainError" }
]
}
},
cartUpsell: {
on: {
NEXT: "COMPLETED"
}
},
domainError: {
/_..._/
},

    // 🎯 Completion State: Chains to the Express Funnel
    COMPLETED: {
      type: "final",
      data: {
        resolvedRoute: context => ({
          name: "ExpressCheckout",
          params: context.orderData
        }),
        // 🎯 Explicitly requests the next funnel for chaining
        nextFunnelId: "express-checkout-flow"
      }
    }

},

guards: {
// A specialized funnel-specific guard
isValidDomainSelection: (context, event) => event.data?.domain !== ""
},

services: {
// A specialized service for this funnel
checkDomain: ()=>true)
}
};
