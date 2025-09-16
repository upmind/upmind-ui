# System Manager Module

The **System Manager** Module is a critical component of the **Upmind Headless** framework responsible for managing system-related configurations and settings. It ensures that system-specific data is retrieved and available for use in the application's user interface.

## Table of Contents

- [System Manager Module](#system-manager-module)
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

The **System Manager** Module can be imported as a named export and accessed through the "upmind" object in your JavaScript project.

(For specific installation details within the **Upmind Headless** framework, please refer to the main framework README.)

## State Machine Overview

The module employs the XState library to create a powerful state machine that orchestrates the retrieval of system settings and configurations. Below is an overview of the state machine's functionality:

- **Processing**: This is the initial state where the module begins its operations. It further breaks down into sub-states:
  - **Organisation**: Invokes a service to fetch organization-specific configurations.

  - **Settings**: Retrieves system-related settings, including theming, language preferences, and currency support.

  - **Config**: Fetches system-specific values and configurations.

  - **Modules**: Retrieves information about modules related to the system.

  - **Currencies**: Fetches information about supported currencies for the system.

- **Available**: This state signifies the successful completion of system-related data retrieval. It ensures that the necessary data is available for use in the application.

- **Error**: Handles errors that may occur during data retrieval. Users can choose to retry processing in case of an error.

## Usage

```javascript
import { useSystem as useUpmindSystem } from `@upmind-automation/headless`;
import { useActor } from "@xstate/vue"; // or @xstate/react, @xstate/svelte, etc.

// Its a good idea to create a composable
// This will handle the reactive state from the service
// and provide a simple interface to the component
export const useSystem= () => {
  const session = useUpmindSystem();

  const { state } = useActor(session.service);

  return {
    state: computed(() => state.value.value),
    values: computed(() => state.value.context),
    isAvailable: computed(() => ["available"].some(state.value.matches)),
    isProcessing: computed(() => ["processing"].some(state.value.matches)),
    hasError: computed(() => ["error"].some(state.value.matches))
  };
};
```

```javascript
import { useSystem } from "@/path-to-system-composable";
const { state, isAvailable, values } = useSystem();
```

## Configuration

The **System Manager** module seamlessly integrates into your project with minimal configuration. It handles system-related tasks, ensuring a smooth user experience.

## API Documentation

There is no specific API documentation available for this module.

## Examples

(Examples or use cases for this module will be provided later.)

## Contributing

This module is not open source, and therefore, there is no contributing information.

## License

The **System Manager** Module is proprietary and closed source.

## Acknowledgments

The **System Manager** in the **Upmind Headless** framework leverages the power of XState for state management and is designed to enhance the Upmind ecosystem's capabilities.

[![XState](https://img.shields.io/badge/Powered%20by-XState-brightgreen)](https://xstate.js.org/)
