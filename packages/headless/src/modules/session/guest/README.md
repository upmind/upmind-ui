# Guest Manager Module

The **Guest Manager** module within the **Upmind Headless** framework is designed to handle user guests, including managing authentication tokens and role based users. This module is responsible for ensuring that users have a valid guest when interacting with the Upmind platform.

## Table of Contents

- [Guest Manager Module](#guest-manager-module)
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

To use the **Guest Manager** module, you can import it from the `@upmind-automation/headless` package in your JavaScript project.

(For specific installation details within the **Upmind Headless** framework, please refer to the main framework README.)

## State Machine Overview

The module operates as a state machine with built-in context to manage user guests. It goes through different states to check and generate user tokens and claims. Below are the key states:

- **Loading**: In this initial state, the module checks if there is a valid token. If present, it proceeds to the **Processed** state. Otherwise, it generates a role based token in the "Generating" state.

- **Processing**: This state represents a processing state for specific actions, which can be invoked as needed. It has three sub-states, **Generating**, **Refreshing**, and **Persisting**, depending on the action being performed.
  - **Generating**: In this state, the module generates a role based token. Once generated, it transitions to the **Persisting** state.
  - **Refreshing**: In this state, the module refreshes a role based token. Once refreshed, it transitions to the **Persisting** state.
  - **Persisting**: In this state, the module persists the token in local storage. Once persisted, it transitions to the **Processed** state.

- **Processed**: This state indicates that a valid guest + token is available. It has two sub-states, **Available** and **Stale**, depending on the guest's freshness. If the guest becomes stale, you can trigger a **REFRESH** to move back to the **Processing** state.

- **Error**: If an error occurs during guest management, the module transitions to this state. You can retry the operation or cancel it.

- **Complete**: This is the final state, indicating that the guest management process is complete.

## Usage

```javascript
import { useGuest as useUpmindGuest } from `@upmind-automation/headless`;
import { useActor } from "@xstate/vue"; // or @xstate/react, @xstate/svelte, etc.

// Its a good idea to create a composable
// This will handle the reactive state from the service
// and provide a simple interface to the component
export const useGuest= () => {
  const guest = useUpmindGuest();

  const { state } = useActor(guest.service);

  return {
    state: computed(() => state.value.value),
    token: computed(() => state.value.context.token.access_token),
    role: computed(() => state.value.context.role),
    values: computed(() => state.value.context),
    // ---
    isLoading: computed(() => ["loading"].some(state.value.matches)),
    isProcessing: computed(() => ["processing"].some(state.value.matches)),
    isGenerating: computed(() =>
      ["processing.generating"].some(state.value.matches)
    ),
    isRefreshing: computed(() =>
      ["processing.generating"].some(state.value.matches)
    ),
    isPersisting: computed(() =>
      ["processing.persisting"].some(state.value.matches)
    ),
    isAvailable: computed(() => ["processed"].some(state.value.matches)),
    isStale: computed(() => ["processed.stale"].some(state.value.matches)),
    hasError: computed(() => ["error"].some(state.value.matches))
    // ---
  };
};
```

```javascript
import { useGuest } from "@/path-to-guest-composable";
const { state, isAvailable, isGenerating, isProcessing, isStale, useToken } =
  useGuest();

const currentToken = useToken();
```

## Configuration

The **Guest Manager** module seamlessly integrates into your project with minimal configuration. It handles guest-related tasks, ensuring a smooth user experience.

## API Documentation

There is no specific API documentation available for this module.

## Examples

(Examples or use cases for this module will be provided later.)

## Contributing

This module is not open source, and therefore, there is no contributing information.

## License

The **Guest Manager** module is proprietary and closed source.

## Acknowledgments

The **Guest Manager** in the **Upmind Headless** framework leverages the power of XState for state management and is designed to enhance the Upmind ecosystem's capabilities.

[![XState](https://img.shields.io/badge/Powered%20by-XState-brightgreen)](https://xstate.js.org/)
