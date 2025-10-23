[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / RoutingEngineContext

# RoutingEngineContext

Interface representing the context for the routing engine, typically managed by an XState machine.
It holds the state of active flows, current route, and references to other services.

## Properties

### basketHelper?

```ts
optional basketHelper: ActorRef<any, any>;
```

An ActorRef to the basket helper service, for inter-service communication.

***

### basketId?

```ts
optional basketId: string;
```

The ID of the current shopping basket, if applicable.

***

### currentFlow?

```ts
optional currentFlow: Flow;
```

The currently active flow in the routing engine.

***

### currentRoute?

```ts
optional currentRoute: Route;
```

The current route object being managed by the routing engine.

***

### error?

```ts
optional error: ResponseError;
```

An error object encountered by the routing engine.

***

### flows

```ts
flows: Flow[];
```

An array of active or defined navigational flows.
