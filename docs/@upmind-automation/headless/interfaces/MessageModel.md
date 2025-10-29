[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / MessageModel

# MessageModel

Interface representing a client-side model for an [IMessage](IMessage.md),
simplifying the structure for UI consumption.

## Properties

### id

```ts
id: string;
```

The unique identifier of the message.

***

### isHidden

```ts
isHidden: boolean;
```

`true` if the message is hidden.

***

### message

```ts
message: string;
```

The message content.

***

### translations

```ts
translations: object;
```

Translation metadata for the message.

#### code

```ts
code: object;
```

An object where keys are locale codes and values contain translated names.

##### code.name

```ts
name: string;
```

The translated name of the message for the given locale.
