# Session Manager Module

The **Session Manager** module within the **Upmind Headless** framework is designed to handle user sessions, specifically the auth token and claims. It is a state machine that manages the session lifecycle and is responsible for ensuring that users have a valid session when interacting with the Upmind platform.

Sessions can be of different types, namely:
Guest, User, Admin, etc. Each session type has a different set of claims and permissions. The **Session Manager** module handles the session lifecycle for all session types.

The **Session Manager** module will invoke the appropriate session handler based on the session type. The session handler is ONLY responsible for generating and refreshing the token and claims. It is responsible for the session's persistence and retrieval from local storage. Session handlers are short-lived and are only invoked when needed to either generate or refresh a token.

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

To use the **Session Manager** module, you can import it from the `@upmind-automation/headless` package in your JavaScript project.

(For specific installation details within the **Upmind Headless** framework, please refer to the main framework README.)

## State Machine Overview

The module operates as a state machine with built-in context to manage user sessions. It goes through different states to check and generate user tokens and claims. Below are the key states:

- **Loading**: In this initial state, the module checks if there is a valid token. If present, it proceeds to the **Processed** state. Otherwise, it generates a role based token in the "Generating" state.

- **Processing**: This state represents a processing state for specific actions, which can be invoked as needed. It has three sub-states, **Generating**, **Refreshing**, and **Persisting**, depending on the action being performed.
  - **Generating**: In this state, the module generates a role based token. Once generated, it transitions to the **Persisting** state.
  - **Refreshing**: In this state, the module refreshes a role based token. Once refreshed, it transitions to the **Persisting** state.
  - **Persisting**: In this state, the module persists the token in local storage. Once persisted, it transitions to the **Processed** state.

- **Processed**: This state indicates that a valid session + token is available. It has two sub-states, **Available** and **Stale**, depending on the session's freshness. If the session becomes stale, you can trigger a **REFRESH** to move back to the **Processing** state.

- **Error**: If an error occurs during session management, the module transitions to this state. You can retry the operation or cancel it.

- **Complete**: This is the final state, indicating that the session management process is complete.

## Usage

```javascript
import { useSession as useUpmindSession } from `@upmind-automation/headless`;
import { useActor } from "@xstate/vue"; // or @xstate/react, @xstate/svelte, etc.

// Its a good idea to create a composable
// This will handle the reactive state from the service
// and provide a simple interface to the component
export const useSession= () => {
  const session = useUpmindSession();

  const { state } = useActor(session.service);

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
import { useSession } from "@/path-to-session-composable";
const { state, isAvailable, isGenerating, isProcessing, isStale, useToken } =
  useSession();

const currentToken = useToken();
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

The **Session Manager** in the **Upmind Headless** framework leverages the power of XState for state management and is designed to enhance the Upmind ecosystem's capabilities.

[![XState](https://img.shields.io/badge/Powered%20by-XState-brightgreen)](https://xstate.js.org/)
