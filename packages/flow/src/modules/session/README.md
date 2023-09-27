# Session Manager Module

The **Session Manager** module within the **Upmind Flow** framework is designed to handle user sessions, including managing authentication tokens and user baskets. This module is responsible for ensuring that users have a valid session when interacting with the Upmind platform.

## Table of Contents

- [Session Manager Module](#session-manager-module)
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

To use the **Session Manager** module, you can import it from the `@upmind/flow` package in your JavaScript project.

(For specific installation details within the **Upmind Flow** framework, please refer to the main framework README.)

## State Machine Overview

The module operates as a state machine with built-in context to manage user sessions. It goes through different states to check and generate user tokens and baskets. Below are the key states:

- **Checking**: In this initial state, the module checks if a user has a valid token and basket. If both are present, it proceeds to the "Processed" state. Otherwise, it generates a guest token and a new basket in the "Generating" state.

- **Generating**: In this state, the module generates a guest token and a new basket. Once both are generated, it transitions to the "Processed" state.

- **Processed**: This state indicates that a valid session is available. It has two sub-states, "Available" and "Stale," depending on the session's freshness. If the session becomes stale, you can trigger a refresh to move back to the "Processing" state.

- **Processing**: This state represents a processing state for specific actions, which can be invoked as needed.

- **Error**: If an error occurs during session management, the module transitions to this state. You can retry the operation or cancel it.

- **Complete**: This is the final state, indicating that the session management process is complete.

## Usage

```javascript
import { useSession as useUpmindSession } from `@upmind/flow`;
import { useActor } from "@xstate/vue"; // or @xstate/react, @xstate/svelte, etc.

// Its a good idea to create a composable
// This will handle the reactive state from the service
// and provide a simple interface to the component
export const useSession= () => {
  const session = useUpmindSession();

  const { state } = useActor(session.service);

  return {
    state: computed(() => state.value.toStrings()),
    isChecking: computed(() => ["checking"].some(state.value.matches)),
    isGenerating: computed(() => ["generating"].some(state.value.matches)),
    isProcessing: computed(() => ["processing"].some(state.value.matches)),
    isAvailable: computed(() => ["processed"].some(state.value.matches)),
    isStale: computed(() => ["processed.stale"].some(state.value.matches)),
    // ---
    useToken: session.useToken,
    useBasket: session.useBasket,
  };
};
```

```javascript
import { useSession } from "@/path-to-session-composable";
const {
  state,
  isAvailable,
  isGenerating,
  isProcessing,
  isStale,
  useToken,
  useBasket
} = useSession();

const currentToken = useToken();
const currentBasket = useBasket();
```

## Configuration

The **Session Manager** module seamlessly integrates into your project with minimal configuration. It handles session-related tasks, ensuring a smooth user experience.

## API Documentation

There is no specific API documentation available for this module.

## Examples

(Examples or use cases for this module will be provided later.)

## Contributing

This module is not open source, and therefore, there is no contributing information.

## License

The **Session Manager** module is proprietary and closed source.

## Acknowledgments

The **Session Manager** in the **Upmind Flow** framework leverages the power of XState for state management and is designed to enhance the Upmind ecosystem's capabilities.

[![XState](https://img.shields.io/badge/Powered%20by-XState-brightgreen)](https://xstate.js.org/)
