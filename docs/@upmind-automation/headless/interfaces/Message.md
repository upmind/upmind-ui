[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Message

# Message

Interface representing a client-side message object for display in the UI.
It contains content, display preferences, and optional actions.

## Properties

### actions?

```ts
optional actions: object[];
```

An array of actionable buttons or links to display with the message.

#### handler()?

```ts
optional handler: (context) => void | Promise<void>;
```

A handler function to execute when the action is clicked.

##### Parameters

###### context

`any`

The context in which the action is handled.

##### Returns

`void` \| `Promise`\<`void`\>

A promise or `void`.

#### icon?

```ts
optional icon: string;
```

An optional icon to display in the action button.

#### label

```ts
label: string;
```

The label text for the action button.

#### value

```ts
value: string;
```

A unique value to identify the action when it's triggered.

***

### copy?

```ts
optional copy: string;
```

The main content or body copy of the message.

***

### created?

```ts
optional created: number;
```

The timestamp when the message was created (Unix epoch time).

***

### data?

```ts
optional data: any;
```

Optional additional data associated with the message, e.g. an error object.

***

### delay?

```ts
optional delay: number;
```

The time in milliseconds to delay before showing the alert.

***

### display

```ts
display: messageDisplays;
```

The [messageDisplays](../enumerations/messageDisplays.md) type dictating how the message should be presented.

***

### hash?

```ts
optional hash: string;
```

An optional hash to uniquely identify and deduplicate messages.

***

### maxAge?

```ts
optional maxAge: number;
```

The time in milliseconds before the alert is automatically dismissed.
Pass `0` to make the alert persist indefinitely.

***

### scheduled?

```ts
optional scheduled: number;
```

The timestamp when the message is scheduled to be displayed (Unix epoch time).

***

### title?

```ts
optional title: string;
```

The title of the message.

***

### type

```ts
type: messageTypes;
```

The [messageTypes](../enumerations/messageTypes.md) type indicating the severity or purpose of the message.
