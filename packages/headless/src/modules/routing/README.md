# Routing Engine Module

The **Routing Engine** module within the **Upmind Headless** framework is responsible for determining the optimal flow of user interactions within an e-commerce application. It acts as an intelligent navigation guide, suggesting the next appropriate route based on user actions, application state, and defined business rules.

This module **does not** handle actual routing (e.g., URL changes, page transitions). Instead, it acts as a decision-making engine, providing guidance on the most suitable next step in the user journey.

## Table of Contents

- [Routing Engine Module](#routing-engine-module)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
  - [State Machine Overview](#state-machine-overview)
  - [Usage](#usage)
  - [Configuration](#configuration)
    - [Handling URL Parameters](#handling-url-parameters)
  - [API Documentation](#api-documentation)
  - [Contributing](#contributing)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

## Getting Started

### Installation

To use the **Routing Engine** module, you can import it from the `@upmind-automation/headless` package in your JavaScript project.

(For specific installation details within the **Upmind Headless** framework, please refer to the main framework README.)

## State Machine Overview

The Routing Engine operates as a state machine with a distinct node for each key navigation aspect within the e-commerce application. This granular approach allows for precise control over the flow and enables the engine to accurately determine the most suitable route based on the current context.

**Key Nodes:**

- **Loading:** Represents the initial state or when the engine is initialising the Basket, Session, and other data.
- **Empty:** Indicates an initial state when a basket has no items and has not been provided with data to add.
- **Product:**
  - **Product > Add:** Represents the state for adding a new product.
  - **Product > Edit:** Represents the state for editing an existing product.
  - **Product > Recommendations:** Represents the state for displaying product recommendations.
  - **Product > NotFound:** Represents the state for handling cases where the requested product is not found.
  - **Product > RequiresAction:** Represents the state for handling cases where user action is required.
  - **Product > RequiresActionRelated:** Represents the state for handling cases where user action is required for related products.
- **NotFound:** Represents a general "not found" state for any other invalid or non-existent routes.
- **Cart:** Represents the shopping cart state.
- **Session:**
  - **Session > Login:** Represents the login state.
  - **Session > Register:** Represents the registration state.
  - **Session > ForgotPassword:** Represents the state for handling forgotten passwords.
- **Checkout:** Represents the checkout process.
- **Order:**
  - **Order > Success:** Represents a successful order completion.
  - **Order > Failed:** Represents an order that encountered an error during processing.

The Routing Engine transitions between these nodes based on user interactions, application state, and defined business rules. This dynamic approach ensures that the user is always guided to the most relevant and appropriate part of the application.

## Usage

```javascript
import { useRoutingEngine } from "@upmind-automation/headless";
import { useActor } from "@xstate/vue"; // or @xstate/react, @xstate/svelte, etc.

const { service } = useRoutingEngine({
  // Example Flow/Configuration

  [ROUTES.PRODUCT_ADD]: {
    add: {
      handler: (context, event) => {
        // Assuming context contains productId
        // This is where you would call your navigation function
        router.push(`/product/add/${event.pid}`);
      },
      guard: context => {
        // do logic to determine if we can transition to this node
        const valid = true || false;
        return valid;
      },
      targets: {
        next: [
          {
            target: "product.notFound",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            target: "product/requiresAction.related",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            target: "product.requiresAction.invalid",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            target: "product/recommendations",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            target: "checkout",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            target: "cart",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
        ],
        back: [{ target: "cart" }],
        fallback: [{ target: "cart" }],
      },
    },
    edit: {
      handler: (context, event) => {
        // Assuming context contains productId
        // This is where you would call your navigation function
        router.push(`/product/edit/${event.bpid}`);
      },
      guard: context => {
        // do logic to determine if we can transition to this node
        const valid = true || false;
        return valid;
      },
      targets: {
        next: [
          {
            target: "product.notFound",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            target: "product/requiresAction.related",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            target: "product.requiresAction.invalid",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            target: "product/recommendations",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            target: "checkout",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
          {
            target: "cart",
            guard: context => {
              // do logic to determine if we can transition to this node
              const valid = true || false;
              return valid;
            },
          },
        ],
        back: [{ target: "cart" }],
        fallback: [{ target: "cart" }],
      },
    },
    recommendations: {
      handler: context => {
        // Assuming context contains productId
        // This is where you would call your navigation function
        router.push(`/product/recommendations`);
      },
      guard: context => {
        // do logic to determine if we can transition to this node
        const valid = true || false;
        return valid;
      },

      targets: [
        {
          target: "checkout",
          guard: context => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: "cart",
          guard: context => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
      ],
    },
  },
  cart: {
    handler: context => {
      router.push("/cart");
    },
    guard: context => {
      // do logic to determine if we can transition to this node
      const valid = true || false;
      return valid;
    },
    targets: {
      next: [
        {
          target: "checkout",
          guard: context => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
      ],
      back: [], // dont go anywhere
      fallback: [], // dont go anywhere
    },
  },
  session: {
    handler: context => {
      router.push("/session");
    },
    guard: context => {
      // do logic to determine if we can transition to this node
      const valid = true || false;
      return valid;
    },
    targets: {
      next: [
        {
          target: "checkout",
          guard: context => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
      ],
      back: [{ target: "cart" }],
      fallback: [{ target: "cart" }],
    },
  },
  checkout: {
    handler: context => {
      router.push("/checkout");
    },
    guard: context => {
      // do logic to determine if we can transition to this node
      const valid = true || false;
      return valid;
    },
    targets: {
      next: [
        {
          target: "order.success",
          guard: context => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
        {
          target: "order.failed",
          guard: context => {
            // do logic to determine if we can transition to this node
            const valid = true || false;
            return valid;
          },
        },
      ],
      back: [{ target: "cart" }],
      fallback: [{ target: "cart" }],
    },
  },
  // ... other nodes ...
});
const { state, send } = useActor(service);

// Sending Events to the Routing Engine
send("next"); // This will navigate to the next step in the flow
send("back"); // This will navigate to the 'previous' / 'back' step in the flow
send("navigate", { target: "checkout" }); // This will 'force' navigate to  a specific step in the flow, but still honouring the guards and fallbacks for the target node
// ...
```

## Configuration

The Routing Engine requires a configuration object or `Flow` to define the possible routes and their transitions. This configuration object will typically include:

- **Route Definitions:**

  - `name`: **Name of the route/node, NB: must match the node naming conventions.** (e.g. 'session.login', 'session.register', 'session.forgot', 'cart', 'checkout', 'product.add', 'product.edit', 'order.success', 'order.failed')
  - `guard` :Conditions for entering the route (e.g., user is logged in, product is available)
  - `handler` function to be executed when the route is entered (e.g., navigation logic)
  - `targets` object:
    - `next`: An array of target objects for forward navigation, each with a `target` property (the name of the destination route) and an array of `guards` (conditions that must be met for the transition to occur).
    - `back`: An array of target objects for backward navigation, similar to `next`.
    - `fallback`: An array of target objects to be used if none of the `next` or `back` targets match.

### Handling URL Parameters

The Routing Engine can be configured to analyze URL parameters and use them to determine the appropriate route. This allows for dynamic routing based on user input.

## API Documentation

(Detailed API documentation for the module's functionalities will be provided later.)

## Contributing

This module is not open source, and therefore, there is no contributing information.

## License

The **Routing Engine** module is proprietary and closed source.

## Acknowledgments

The **Routing Engine** in the **Upmind Headless** framework leverages the power of XState for state management and is designed to enhance the user experience within the Upmind ecosystem.

[![XState](about:sanitized)](https://xstate.js.org/)
