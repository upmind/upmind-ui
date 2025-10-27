[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IMessage

# IMessage

Interface representing a message object as typically retrieved from a backend API.
This includes unique identifiers, content, and translation metadata.

## Properties

### created\_at

```ts
created_at: string;
```

The timestamp when the message was created.

***

### id

```ts
id: string;
```

The unique identifier of the message.

***

### is\_hidden

```ts
is_hidden: boolean;
```

`true` if the message is hidden from display.

***

### message

```ts
message: string;
```

The message content string.

***

### translations

```ts
translations: object;
```

Translation metadata for the message, including locale codes and names.

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

***

### updated\_at

```ts
updated_at: string;
```

The timestamp when the message was last updated.
