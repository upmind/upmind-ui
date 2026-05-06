# Recommendations Engine Module

The **Recommendations Engine** module within the **Upmind Headless** framework is designed to handle product recommendations based on existing products within the baskets This module is responsible for ensuring that the business can offer users UpSells and CrossSells base don products already in their basket when interacting with the Upmind platform.

<!-- TODO: describe the basket role in more detail -->

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

The module operates as a state machine with built-in context to manage user baskets. It goes through different states to check and manage baskets. Below are the key states:

- **Subscribing**: In this initial state, the module checks waits for valid basket to exist and be in a state that actually has products . Once subscribed, it proceeds to the **Loading** state.

- **Loading**/**Refreshing** \*/: In this state, the module checks for any recommendations for the products in the basket. Once fetched, it proceeds to the **Processed** state.

- **Available**: This state indicates that a valid basket is available. It has sub-states, base don interaction with the user

- **Seen**: This state indicates that the user has seen the recommendations.

- **Unavailable**/**Empty**: This state indicates that there are no recommendations available for the products in the basket.

- **Processing**: This state indicates that the module is processing the basket to add the recommended products.

- **Processed**: This state indicates that the module has successfully processed the basket and added the recommended products. At this point there may be new recommendations available, and the module will transition to the **Refreshing** state to fetch them.

- **Error**: If an error occurs during basket management, the module transitions to this state. You can retry the operation or cancel it.

- **Complete**: This is the final state, indicating that the basket management process is complete.

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

| Property | Controls | If omitted (default) |
|---|---|---|
| `conditions` | Whether the recommendation is shown or hidden | Always shown |
| `inBasketConditions` | Whether `meta.added` is set | `true` when any variant of the rec's product is in the basket |

Both properties use the FE-2655 `ConditionalValue<T>` shape (`default` + `rules` + `when` + `then`). They're evaluated independently — `conditions` decides visibility (hidden recs are filtered out before the consumer sees them), `inBasketConditions` decides the `meta.added` flag for those that survive.

#### `conditions` — show / hide

`ConditionalValue<"visible" | "hidden">`. Author writes rules that produce one of those two values.

```json
{
  "object_id": "prod-123",
  "conditions": {
    "default": "visible",
    "rules": [
      { "when": { "basket.pids": { "$contains": "prod-456" } }, "then": "hidden" }
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
    "rules": [
      { "when": { "basketProduct.bcm": { "$eq": 12 } }, "then": true }
    ]
  }
}
```

Resolution rules:

- **Property omitted** — loose product_id match: any variant of the rec's product in the basket sets `meta.added = true`.
- **Property present, no matching basket products** — `meta.added` falls back to `default`.
- **Property present, matching basket products exist** — engine evaluates per match; `meta.added = true` if any evaluation resolves to `true`, otherwise `default`.

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
      { "when": { "basket.pids": { "$contains": "prod-456" } }, "then": "hidden" }
    ]
  },
  "inBasketConditions": {
    "default": false,
    "rules": [
      { "when": { "basketProduct.bcm": { "$eq": 12 } }, "then": true }
    ]
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
