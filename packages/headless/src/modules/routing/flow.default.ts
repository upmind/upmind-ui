import type { AnyEventObject } from "xstate";
import type { Flow } from "./types";
import { ROUTE } from "./types";

export default [
  {
    id: ROUTE.LOADING,
    handler: (context: any) => {},
    guard: (context: any, event: AnyEventObject) => {
      // do logic to determine if we can transition to this node
      // eg:
      // Url has Product params to add to basket
      // Basket has no items

      return true;
    },
    targets: {
      next: [
        {
          target: ROUTE.PRODUCT_ADD,
          guard: (context: any, event: AnyEventObject) => true,
        },
      ],
      back: [{ target: ROUTE.EMPTY }],
      fallback: [{ target: ROUTE.EMPTY }],
    },
  },
  {
    handler: (context: any, event: AnyEventObject) => {
      // Assuming context contains productId
      // This is where you would call your navigation function
      context.router.push(`/product/add/${event.data.pid}`);
    },
    guard: (context: any, event: AnyEventObject) => {
      // do logic to determine if we can transition to this node
      const valid = true || false;
      return valid;
    },
    targets: {
      next: [
        {
          target: ROUTE.PRODUCT_NOT_FOUND,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        // a related product requires action, so we automatically navigate to the related product
        {
          target: ROUTE.PRODUCT_EDIT,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: ROUTE.PRODUCT_REQUIRES_ACTION,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: ROUTE.RECOMMENDATIONS,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: ROUTE.CHECKOUT,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: ROUTE.CART,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
      ],
      back: [{ target: ROUTE.CART }],
      fallback: [{ target: ROUTE.CART }],
    },
    id: ROUTE.PRODUCT_ADD,
  },
  {
    handler: (context: any, event: AnyEventObject) => {
      // Assuming context contains productId
      // This is where you would call your navigation function
      context.router.push(`/product/edit/${event.bpid}`);
    },
    guard: (context: any, event: AnyEventObject) => {
      // do logic to determine if we can transition to this node
      const valid = true || false;
      return valid;
    },
    targets: {
      next: [
        {
          target: ROUTE.PRODUCT_NOT_FOUND,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: ROUTE.PRODUCT_EDIT,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: ROUTE.PRODUCT_REQUIRES_ACTION,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: ROUTE.RECOMMENDATIONS,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: ROUTE.CHECKOUT,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: ROUTE.CART,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
      ],
      back: [{ target: ROUTE.CART }],
      fallback: [{ target: ROUTE.CART }],
    },
    id: ROUTE.PRODUCT_EDIT,
  },
  {
    handler: (context: any, event: AnyEventObject) => {
      // Assuming context contains productId
      // This is where you would call your navigation function
      context.router.push(`/product/edit/${event.bpid}`);
    },
    guard: (context: any, event: AnyEventObject) => {
      // do logic to determine if we can transition to this node
      const valid = true || false;
      return valid;
    },
    id: ROUTE.PRODUCT_REQUIRES_ACTION,
  },
  {
    handler: (context: any) => {
      // Assuming context contains productId
      // This is where you would call your navigation function
      context.router.push(`/product/recommendations`);
    },
    guard: (context: any, event: AnyEventObject) => {
      // do logic to determine if we can transition to this node
      const valid = true || false;
      return valid;
    },

    targets: [
      {
        target: ROUTE.CHECKOUT,
        guard: (context: any, event: AnyEventObject) => {
          // do logic to determine if we can transition to this node
          const valid = true || false;
          return valid;
        },
      },
      {
        target: ROUTE.CART,
        guard: (context: any, event: AnyEventObject) => {
          // do logic to determine if we can transition to this node
          const valid = true || false;
          return valid;
        },
      },
    ],
    id: ROUTE.RECOMMENDATIONS,
  },
  {
    handler: (context: any) => {
      context.router.push("/cart");
    },
    guard: (context: any, event: AnyEventObject) => {
      // do logic to determine if we can transition to this node
      // eg the basket needs to have items to go here
      const valid = true || false;
      return valid;
    },
    targets: {
      next: [
        {
          target: ROUTE.CHECKOUT,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
      ],
      back: [], // dont go anywhere
      fallback: [{ target: ROUTE.EMPTY }],
    },
    id: ROUTE.CART,
  },
  {
    handler: (context: any) => {
      context.router.push("/auth/login");
    },
    guard: (context: any, event: AnyEventObject) => {
      // do logic to determine if we can transition to this node
      const valid = true || false;
      return valid;
    },
    targets: {
      next: [
        {
          target: ROUTE.CHECKOUT,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
      ],
      back: [{ target: ROUTE.CART }],
      fallback: [], // dont go anywhere
    },
    id: ROUTE.LOGIN,
  },
  {
    handler: (context: any) => {
      context.router.push("/auth/register");
    },
    guard: (context: any, event: AnyEventObject) => {
      // do logic to determine if we can transition to this node
      const valid = true || false;
      return valid;
    },
    targets: {
      next: [
        {
          target: ROUTE.CHECKOUT,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
      ],
      back: [{ target: ROUTE.CART }],
      fallback: [], // dont go anywhere
    },
    id: ROUTE.REGISTER,
  },
  {
    handler: (context: any) => {
      context.router.push("/auth/forgot");
    },
    guard: (context: any, event: AnyEventObject) => {
      // do logic to determine if we can transition to this node
      const valid = true || false;
      return valid;
    },
    targets: {
      next: [{ target: ROUTE.LOGIN }],
      back: [{ target: ROUTE.LOGIN }],
      fallback: [{ target: ROUTE.LOGIN }],
    },
    id: ROUTE.FORGOT_PASSWORD,
  },
  {
    handler: (context: any) => {
      context.router.push("/checkout");
    },
    guard: (context: any, event: AnyEventObject) => {
      // do logic to determine if we can transition to this node,
      // eg:
      //  Basket has no items,
      //  Basket has no auth,
      //  Basket needs required order custom fields/info
      const valid = true || false;
      return valid;
    },
    targets: {
      next: [{ target: ROUTE.ORDER }],
      back: [{ target: ROUTE.CART }],
      fallback: [
        {
          target: ROUTE.LOGIN,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node,
            // eg:
            //  Basket has no auth,
            //  token is a client/expired token
            const valid = true || false;
            return valid;
          },
        },
        {
          target: ROUTE.REGISTER,
          guard: (context: any, event: AnyEventObject) => {
            // do logic to determine if we can transition to this node,
            // eg:
            //  Basket has no auth,
            //  Token is a guest token
            const valid = true || false;
            return valid;
          },
        },
        // Fallback to cart for any other reason
        { target: ROUTE.CART },
      ],
    },
    id: ROUTE.CHECKOUT,
  },
] as Flow[];
