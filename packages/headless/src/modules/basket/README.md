# Basket Manager Module

The **Basket Manager** module within the **Upmind Headless** framework is designed to handle user baskets. This module is responsible for ensuring that users have a valid basket when interacting with the Upmind platform.

<!-- TODO: describe the basket role in more detail -->

## Table of Contents

- [Basket Manager Module](#basket-manager-module)
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

To use the **Basket Manager** module, you can import it from the `@upmind-automation/headless` package in your JavaScript project.

(For specific installation details within the **Upmind Headless** framework, please refer to the main framework README.)

## State Machine Overview

The module operates as a state machine with built-in context to manage user baskets. It goes through different states to check and manage baskets. Below are the key states:

- **Loading**: In this initial state, the module checks if there is an existing basket. If present, it proceeds to the **Processed** state. Otherwise, it generates an empty basket in the **Generating** state.

- **Processing**: This state represents a processing state for specific actions, which can be invoked as needed. It has a sub-state, **Generating**
  - **Generating**: In this state, the module generates a role based token. Once generated, it transitions to the **Persisting** state.

- **Processed**: This state indicates that a valid basket is available. It has a sub-state, **Available**.

- **Error**: If an error occurs during basket management, the module transitions to this state. You can retry the operation or cancel it.

- **Complete**: This is the final state, indicating that the basket management process is complete.

## Usage

```javascript
import { useBasket as useUpmindBasket } from `@upmind-automation/headless`;
import { useActor } from "@xstate/vue"; // or @xstate/react, @xstate/svelte, etc.

// Its a good idea to create a composable
// This will handle the reactive state from the service
// and provide a simple interface to the component
export const useBasket= () => {
  const basket = useUpmindBasket();

  const { state } = useActor(basket.service);

  return {
    state: computed(() => state.value.value),
    basket: computed(() => state.value.context.basket),
    values: computed(() => state.value.context),
    // ---
    isLoading: computed(() => ["loading"].some(state.value.matches)),
    isProcessing: computed(() => ["processing"].some(state.value.matches)),
    isGenerating: computed(() =>
      ["processing.generating"].some(state.value.matches)
    ),
    isAvailable: computed(() => ["processed"].some(state.value.matches)),
    hasError: computed(() => ["error"].some(state.value.matches))
    // ---
  };
};
```

```javascript
import { useBasket } from "@/path-to-basket-composable";
const { state, isAvailable, isGenerating, isProcessing, basket } = useBasket();

const currentBasket = basket;
```

## Configuration

The **Basket Manager** module seamlessly integrates into your project with minimal configuration. It handles basket-related tasks, ensuring a smooth user experience.

## API Documentation

There is no specific API documentation available for this module.

## Examples

(Examples or use cases for this module will be provided later.)

## Contributing

This module is not open source, and therefore, there is no contributing information.

## License

The **Basket Manager** module is proprietary and closed source.

## Acknowledgments

The **Basket Manager** in the **Upmind Headless** framework leverages the power of XState for state management and is designed to enhance the Upmind ecosystem's capabilities.

[![XState](https://img.shields.io/badge/Powered%20by-XState-brightgreen)](https://xstate.js.org/)
