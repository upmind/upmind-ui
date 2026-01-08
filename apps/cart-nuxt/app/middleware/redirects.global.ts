import { trimStart } from "lodash-es";
import { useBrand } from "@upmind-automation/client-vue";
import { ROUTE, RegexMatch } from "~/router/types";

/**
 * Global middleware to handle legacy redirects and path prefixing.
 * Matches the logic in the original cart application's routes.ts.
 */
export default defineNuxtRouteMiddleware(async to => {
  const path = to.path;

  // 1. Single catch-all redirect for any route not starting with /order (Legacy Redirect)
  // Ensures legacy routes are redirected to the new /order structure.
  if (path !== "/" && !path.startsWith("/order/")) {
    // Skip system routes that shouldn't be prefixed
    const systemRoutes = [
      "/loading",
      "/error",
      "/unavailable",
      "/not-found",
      "/storefront"
    ];
    if (!systemRoutes.includes(path)) {
      return navigateTo(
        {
          path: `/order/${trimStart(path, "/")}`,
          query: to.query,
          hash: to.hash
        },
        { redirectCode: 301 }
      );
    }
  }

  // 2. Legacy internal redirects (from original routes.ts)

  // /order/cart -> /order/basket
  if (path === "/order/cart") {
    return navigateTo(
      { name: ROUTE.BASKET, query: to.query },
      { redirectCode: 301 }
    );
  }

  // /orders/:oid -> /order/:oid
  const ordersMatch = path.match(new RegExp(`^/orders/(${RegexMatch.UUID})$`));
  if (ordersMatch) {
    return navigateTo(
      {
        name: ROUTE.ORDER,
        params: { oid: ordersMatch[1] },
        query: to.query
      },
      { redirectCode: 301 }
    );
  }

  // /order/products -> /order/shop
  if (path === "/order/products") {
    return navigateTo(
      { name: ROUTE.CATALOGUE, query: to.query },
      { redirectCode: 301 }
    );
  }

  // /order/product/edit/:bpid -> /order/basket/:bpid
  const productEditMatch = path.match(
    new RegExp(`^/order/product/edit/(${RegexMatch.UUID})$`)
  );
  if (productEditMatch) {
    return navigateTo(
      {
        name: ROUTE.BASKET_PRODUCT_EDIT,
        params: { bpid: productEditMatch[1] },
        query: to.query
      },
      { redirectCode: 301 }
    );
  }

  // /order/product/add/:pid -> /order/product/:pid
  const productAddMatch = path.match(
    new RegExp(`^/order/product/add/(${RegexMatch.UUID})$`)
  );
  if (productAddMatch) {
    return navigateTo(
      {
        name: ROUTE.PRODUCT_CONFIGURE,
        params: { pid: productAddMatch[1] },
        query: to.query
      },
      { redirectCode: 301 }
    );
  }

  // 3. Storefront Redirect logic
  if (path === "/storefront") {
    const { hasStorefront, storefrontUrl } = useBrand();

    // Redirect to external storefront URL if available
    if (storefrontUrl.value) {
      return window.location.replace(storefrontUrl.value);
    }

    // Otherwise, if we allow storefront: redirect to internal catalogue
    if (hasStorefront.value) {
      return navigateTo({ name: ROUTE.CATALOGUE });
    }

    // Fallback to basket if no storefront is available
    return navigateTo({ name: ROUTE.BASKET });
  }
});
