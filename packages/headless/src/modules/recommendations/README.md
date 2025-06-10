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
