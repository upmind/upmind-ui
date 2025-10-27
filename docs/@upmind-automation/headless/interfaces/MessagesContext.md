[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / MessagesContext

# MessagesContext

Interface representing the context for a message management system,
typically managed by an XState machine. It holds references to active message actors.

## Properties

### messages

```ts
messages: ActorRef<any, any>[];
```

An array of `ActorRef`s, each pointing to an XState actor managing an individual message's lifecycle.
