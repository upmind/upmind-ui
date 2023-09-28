# API Requests Manager Module

The **API Requests Manager** module within the **Upmind Flow** framework is a powerful tool for handling HTTP requests to the Upmind API and external endpoints. It simplifies request management, ensures efficient communication, and provides cache handling capabilities.

## Table of Contents

- [API Requests Manager Module](#api-requests-manager-module)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
  - [Usage](#usage)
  - [Request Configuration](#request-configuration)
  - [API Request Handler](#api-request-handler)
  - [Requests Manager](#requests-manager)
    - [Parallel and Duplicate Requests](#parallel-and-duplicate-requests)
  - [API Documentation](#api-documentation)
  - [Examples](#examples)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

## Getting Started

### Installation

To use the **API Requests Manager** module in your project, follow these installation steps:

1. Install **Upmind Flow** if you haven't already. Refer to the **Upmind Flow** framework's README for installation instructions.

2. Import the **API Requests Manager** module from the `@upmind/flow` package in your JavaScript project.

## Usage

The **API Requests Manager** module functions as a state machine with built-in context to store each request you send. Making an API request is straightforward. Here's an example of fetching data from an API endpoint:

```javascript
import { useApi as useUpmindApi } from `@upmind/flow`;
import { useActor } from "@xstate/vue"; // or @xstate/react, @xstate/svelte, etc.

// Its a good idea to create a composable
// This will handle the reactive state from the service
// and provide a simple interface to the component
export const useApi = () => {
  const api = useUpmindApi();

  const { state } = useActor(api.service);

  return {
    state: computed(() => state.value.toStrings()),
    count: computed(() => keys(state.value.context.requests)?.length || 0),
    requests: computed(() => state.value.context.requests),
    isIdle: computed(() => ["loading"].some(state.value.matches)),
    isProcessing: computed(() => ["processing"].some(state.value.matches)),
    // ---
    useUrl: api.useUrl,
    useTime: api.useTime,
    get: api.get,
    post: api.post
  };
};
```

```javascript
import { useApi } from "@/path-to-api-composable";
const products = useApi()
  .get({ url: "https://dummyjson.com/products/" })
  .then(({ data }) => data);
```

## Request Configuration

No specific configuration is required for the **API Requests Manager** module at this stage, other than setting `.env` variables for the API endpoint. The module seamlessly integrates into your project with minimal setup.

Each request can be customized with the following options:

- `url`: The URL of the API endpoint.
- `init`: Configuration options for the _fetch API_, including headers, request method, and more.
- `useCache`: A flag to indicate whether to use caching for the request.
- `maxAge`: The maximum age of the cache, in seconds.
- `data`: The data to be sent with the request.

## API Request Handler

The API Request Handler state machine is designed to handle individual HTTP requests. It offers features such as request caching, automatic error handling, and asynchronous request processing.

Here's an overview of its states:

- **Available**: The initial state, where requests are received or initiated. It supports various HTTP methods like GET, POST, PUT, PATCH, and DELETE.

- **Processing**: The state where the actual request is sent to the API. It handles responses, errors, and cancellations.

- **Cached**: If a GET request is cacheable, it moves to this state after processing. It automatically refreshes if it becomes stale.

- **Stale**: The state indicating that a cached GET request has become stale. It provides options to refresh or cancel the request.

- **Error**: Handles errors and offers the option to retry the request or cancel it.

- **Complete**: The final state, indicating the completion of the request process. This also sends any parent a message to remove/destroy the request.

## Requests Manager

The Requests Manager state machine coordinates multiple API requests. It tracks and manages the status of these requests efficiently. Key features include:

- **Loading**: The initial state, where the manager checks if there are any pending requests to process.

- **Processing**: The state where requests are actively processed. If there are no pending requests, it transitions back to the "Loading" state.

- **Complete**: The final state, indicating that all requests have been processed and the manager has completed its task.

The API Module simplifies handling API requests within your application, making it easy to integrate and manage HTTP interactions with the Upmind API. It ensures robust error handling, request caching, and efficient coordination of multiple requests.

### Parallel and Duplicate Requests

The **API Requests Manager** allows you to make parallel requests, providing flexibility in handling various scenarios.

- If the same request is made multiple times, the module automatically detects it and handles it accordingly, preventing duplicate requests.

- If the request is cached, the module returns the cached response, preventing duplicate requests.

- If the cached response is stale, the module automatically refreshes it the next time the same request is made.

## API Documentation

Currently, there is no dedicated API documentation for this module. However, you can refer to the module's usage examples and the **Upmind Flow** framework's main documentation for practical guidance.

## Examples

Below is an example of making multiple requests, with duplicates over time to demonstrate the caching mechanism.

request 1 is periodically getting products with standard caching
request 2 is periodically getting a single product with a reduced cache time (maxAge)
request 3 is periodically getting a single product with no caching

```javascript
import { useApi } from "@/path-to-api-composable";
import { delay, forEach } from "lodash-es";

const { get, useTime } = useApi();

// a mix of duplicate requests to illustrate the caching mechanism
// and requests with different maxAge to illustrate the cache time
// and requests with useCache: false to illustrate no caching
const requests = [
  // --- request 1
  { url: "https://dummyjson.com/products/", delay: useTime().IMMIDIATE },
  { url: "https://dummyjson.com/products/", delay: useTime().IMMIDIATE },
  { url: "https://dummyjson.com/products/", delay: useTime().SECOND * 15 },
  { url: "https://dummyjson.com/products/", delay: useTime().SECOND * 30 },
  { url: "https://dummyjson.com/products/", delay: useTime().SECOND * 45 },
  { url: "https://dummyjson.com/products/", delay: useTime().SECOND * 60 },
  { url: "https://dummyjson.com/products/", delay: useTime().SECOND * 75 },

  // --- request 2
  {
    url: "https://dummyjson.com/products/1",
    delay: useTime().IMMIDIATE,
    maxAge: useTime().MINUTE
  },
  { url: "https://dummyjson.com/products/1", delay: useTime().IMMIDIATE },
  { url: "https://dummyjson.com/products/1", delay: useTime().SECOND * 15 },
  { url: "https://dummyjson.com/products/1", delay: useTime().SECOND * 30 },
  { url: "https://dummyjson.com/products/1", delay: useTime().SECOND * 45 },
  { url: "https://dummyjson.com/products/1", delay: useTime().MINUTE * 60 },
  { url: "https://dummyjson.com/products/1", delay: useTime().MINUTE * 75 },

  // --- request 3
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().IMMIDIATE,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().IMMIDIATE,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 15,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 30,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 45,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 60,
    useCache: false
  },
  {
    url: "https://dummyjson.com/products/2",
    delay: useTime().SECOND * 75,
    useCache: false
  }
];

// make the requests
forEach(requests, request => {
  delay(
    ({ url, init, useCache, maxAge }) => {
      console.log("fetching...", request.url, request.delay);
      get({ url, init, useCache, maxAge }).then(({ data }) =>
        console.log("fetched", request.url, request.delay)
      );
    },
    request.delay,
    request
  );
});
```

## License

The **API Requests Manager** module is proprietary and closed source.

## Acknowledgments

The **API Requests Manager** in the **Upmind Flow** framework leverages the power of XState for state management and is designed to enhance the Upmind ecosystem's capabilities.

[![XState](https://img.shields.io/badge/Powered%20by-XState-brightgreen)](https://xstate.js.org/)
