# API Requests Module

The "API Requests" module within the "Upmind Flow" framework is designed to simplify and manage HTTP requests to the Upmind API and other external endpoints. Whether you're fetching data from Upmind's servers or interacting with other APIs, this module streamlines the process, ensuring efficient and reliable communication.

## Getting Started

### Installation

To use the "API Requests" module, you can import it from the "@upmind/flow" package in your JavaScript project.

(For specific installation details within the "Upmind Flow" framework, please refer to the main framework README.)

### Basic Usage

The module operates as a state machine with built-in context to store each request you send. Making an API request is as simple as creating an object with the URL and optional configuration, then passing it to the module.

For example, to fetch data from an API endpoint:

```javascript
import { requestsMachine, generateHash, useTime } from "@upmind/flow";
import { waitFor } from "xstate/lib/waitFor";
import { useMachine } from "@xstate/vue";
import { interpret } from "xstate";

const { state, send,service }  = useMachine(requestsMachine, { devTools: true });

async function request(
    { url, init = {} }: { url: string; init: RequestInit },
    useCache = true
  ) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    // Enforce method & header
    set(init, "headers", { "Content-Type": "application/json" });

    const hash = generateHash(url, init);

    // first we trigger the request
    send({
      type: "ADD",
      data: { hash, url, init, useCache }
    });

    // then we get the request from context
    const request = get(state.value.context.requests, hash);

    if (request) {
      // then we await the state of the request to be processed/cached
      await waitFor(request, state =>
        ["processed", "error"].some(state.matches)
      );

      // finnaly we return the response
      return request.state.context?.response?.data;
    }

    // todo
    throw new Error("Request not found");
  }

const upmind = inject("upmind");

const response = request({ url }).then(data => {
  // Do something with the response data.
});
```

### Request Configuration

Each request can be customized with the following options:

- `url`: The URL of the API endpoint.
- `init`: Configuration options for the fetch API, including headers, request method, and more.
- `useCache`: A flag to indicate whether to use caching for the request.
- `maxAge`: The maximum age of the cache, in seconds.

### Request States

The module guides the request through different states:

- **Initialization**: The request is triggered, and its details are added to the module's context.
- **Processing**: The actual HTTP request is made.
- **Processed**: The request is successfully processed, and the response is available. Automatically transitions to the "Completed" state.
- **Processed (with Cache)**: The request is successfully processed, and caching is applied if specified.
- **Processed (Stale Cache)**: Once caching is applied, and after the maximum age, the request automatically enters this state, and allows for REFRESH to go back and reprocess the request.
- **Error**: If an error occurs during processing, the request transitions to this state.
- **Completed**: The request is successfully completed and will notify that it is ready to be removed from the context.

### Parallel and Duplicate Requests

This module allows you to make parallel requests, providing flexibility in handling various scenarios.
If the same request is made multiple times, the module will automatically detect it and handle it accordingly, preventing duplicate requests from being made.
If the request is cached, the module will automatically return the cached response, preventing duplicate requests from being made.
If the cached response is stale, the module will automatically refresh the next time the same request is made.

## Configuration

At this stage, there is no specific configuration required for the "API Requests" module, other than setting environment variables for the API endpoint. The module seamlessly integrates into your project with minimal setup.

## API Documentation

Currently, there is no dedicated API documentation for this module. However, you can refer to the module's usage examples and the framework's main documentation for practical guidance.

## Examples

Below is an example of making multiple requests, with duplicates over time to demonstrate the caching mechanism.

request 1 is periodically getting products with standard caching
request 2 is periodically getting a single product with a reduced cache time (maxAge)
request 3 is periodically getting a single product with no caching

```javascript
import { inject } from "vue";
import type { UseApiFunctions } from "@/modules/api/types";
import { delay, forEach } from "lodash-es";

const {get, useTime} = inject("upmind") as UseApiFunctions;


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

forEach(requests, request => {
  delay(
    ({ url, init, useCache, maxAge }) => {
      console.log("fetching...", request.url, request.delay);
        get({ url, init , useCache, maxAge})
        .then(({ data }) => console.log("fetched", request.url, request.delay));
    },
    request.delay,
    request
  );
});
```

## License

The "API Requests" module is proprietary and closed source.

## Acknowledgments

This module is developed by Dominic da Costa (dominic.dacosta@upmind.com).
Dominic is the main contributor and developer responsible for maintaining this module of the "Upmind Flow" package.
