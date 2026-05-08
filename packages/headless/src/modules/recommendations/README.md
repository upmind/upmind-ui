# Recommendations Engine Module

The **Recommendations Engine** module within the **Upmind Headless** framework handles product recommendations driven by the contents of a basket. It surfaces upsell and cross-sell opportunities based on the products a user has already added.

## Table of Contents

- [Recommendations Engine Module](#recommendations-engine-module)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
  - [State Machine Overview](#state-machine-overview)
  - [Usage](#usage)
  - [Configuration](#configuration)
  - [API Documentation](#api-documentation)
  - [Examples](#examples)
  - [Contributing](#contributing)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

## Getting Started

### Installation

To use the **Recommendations Engine** module, you can import it from the `@upmind-automation/headless` package in your JavaScript project.

(For specific installation details within the **Upmind Headless** framework, please refer to the main framework README.)

## State Machine Overview

The module operates as a state machine that observes the basket and produces recommendations. Its key states are:

- **Subscribing**: Waits for a valid basket that contains products. Once subscribed, transitions to **Loading**.

- **Loading** / **Refreshing**: Resolves the recommendations for the products currently in the basket. On completion, transitions to **Processed**.

- **Available**: A valid set of recommendations is available. Has sub-states based on user interaction.

- **Seen**: The user has seen the recommendations.

- **Unavailable** / **Empty**: No recommendations are available for the products in the basket.

- **Processing**: A recommendation is being added to the basket.

- **Processed**: A recommendation has been added successfully. New recommendations may now apply, so the engine transitions back to **Refreshing**.

- **Error**: An error occurred during processing. The operation can be retried or cancelled.

- **Complete**: Terminal state; the engine is finished.

## Usage

```javascript
import { useRecommendationsEngine as useUpmindRecommendationsEngine } from `@upmind-automation/headless`;
import { useActor } from "@xstate/vue"; // or @xstate/react, @xstate/svelte, etc.

// Its a good idea to create a composable
// This will handle the reactive state from the service
// and provide a simple interface to the component
export const useRecommendationsEngine= () => {
  const {service} = useUpmindRecommendationsEngine();
  const { state } = useActor(service);

  return {
    service,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    // ---
    // ... other methods and properties
  };
};
```

```javascript
import { useRecommendationsEngine } from "@upmind-automation/headless";
const { state } = useRecommendationsEngine();

// ...
```

## Configuration

The **Recommendations Engine** module seamlessly integrates into your project with minimal configuration. It handles recommendation-related tasks, ensuring a smooth user experience.

### Authoring Recommendations

A recommendation is a `RelatedProduct` config — sourced either from the `productsToRecommend` data setting or from a product's API-driven `related` array. Two optional properties control its behaviour:

| Property             | Controls                                      | If omitted (default)                                          |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `conditions`         | Whether the recommendation is shown or hidden | Always shown                                                  |
| `inBasketConditions` | Whether `meta.added` is set                   | `true` when any variant of the rec's product is in the basket |

Both properties use the FE-2655 `ConditionalValue<T>` shape (`default` + `rules` + `when` + `then`). They're evaluated independently — `conditions` decides visibility (hidden recs are filtered out before the consumer sees them), `inBasketConditions` decides the `meta.added` flag for those that survive.

**Cart 2.0 / legacy compatibility.** Both properties are additive and optional on `RelatedProduct`:

- The Linear AC for FE-2263 scopes the authoring UI to Cart 2.0; legacy admin surfaces don't expose the inputs, so existing baskets never produce them. When omitted, `checkConditionVisibility` returns `true` and `isRecommendationInBasket` falls back to the loose product_id match — legacy consumers see identical behaviour to before.
- No runtime gate is added: if authored values reach the engine from a non-Cart 2.0 surface, they're applied rather than failing closed. Add a consumer-level guard keyed on your app's Cart 2.0 capability flag if you need stronger isolation.

#### `conditions` — show / hide

`ConditionalValue<"visible" | "hidden">`. Author writes rules that produce one of those two values.

```json
{
  "object_id": "prod-123",
  "conditions": {
    "default": "visible",
    "rules": [
      {
        "when": { "basket.pids": { "$contains": "prod-456" } },
        "then": "hidden"
      }
    ]
  }
}
```

When omitted the recommendation is shown unconditionally.

#### `inBasketConditions` — drive `meta.added`

`ConditionalValue<boolean>`. Evaluation is **auto-scoped** to basket products whose `product_id` matches the recommendation's `object_id` — authors do not write a "self" reference. Rules that target `basketProduct.*` keys (e.g. `basketProduct.bcm`, `basketProduct.sub_pids`) refine the match against each scoped basket product.

```json
{
  "object_id": "prod-123",
  "inBasketConditions": {
    "default": false,
    "rules": [{ "when": { "basketProduct.bcm": { "$eq": 12 } }, "then": true }]
  }
}
```

Resolution rules:

- **Property omitted** — loose product_id match: any variant of the rec's product in the basket sets `meta.added = true`.
- **Property present, no matching basket products** — `meta.added` falls back to `default`.
- **Property present, matching basket products exist** — engine evaluates per match; `meta.added = true` if any evaluation resolves to `true`, otherwise `default`.

> **Author rules in the canonical form** `{ default: false, rules: [{ then: true }] }`. Per-match results are OR-folded, so `{ default: true, rules: [{ then: false }] }` does not mean "true unless this rule fires" — when multiple basket products match, any product that fails the rule's `when` falls back to `default: true` and wins the OR-fold.

To disable in-basket detection entirely (e.g. for an addon you can buy multiple of), set `default: false` with empty rules:

```json
{
  "object_id": "addon-extra-storage",
  "inBasketConditions": { "default": false, "rules": [] }
}
```

#### Combining both

```json
{
  "object_id": "prod-123",
  "conditions": {
    "default": "visible",
    "rules": [
      {
        "when": { "basket.pids": { "$contains": "prod-456" } },
        "then": "hidden"
      }
    ]
  },
  "inBasketConditions": {
    "default": false,
    "rules": [{ "when": { "basketProduct.bcm": { "$eq": 12 } }, "then": true }]
  }
}
```

Hidden when `prod-456` is in the basket; otherwise shown, with `meta.added` set only when the customer has the annual variant of `prod-123`.

## API Documentation

There is no specific API documentation available for this module.

## Examples

(Examples or use cases for this module will be provided later.)

## Contributing

This module is not open source, and therefore, there is no contributing information.

## License

The **Recommendations Engine** module is proprietary and closed source.

## Acknowledgments

The **Recommendations Engine** in the **Upmind Headless** framework leverages the power of XState for state management and is designed to enhance the Upmind ecosystem's capabilities.

[![XState](https://img.shields.io/badge/Powered%20by-XState-brightgreen)](https://xstate.js.org/)
