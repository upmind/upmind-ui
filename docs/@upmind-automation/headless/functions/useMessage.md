[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useMessage

# useMessage()

```ts
function useMessage(item): object;
```

This is a helper function to extract the message from an actor item.
It is used to simplify the extraction of message properties from the feedback machine.

## Parameters

### item

`any`

This is an actor item from the feedback machine.

## Returns

`object`

### dismiss()

```ts
dismiss: () => any;
```

#### Returns

`any`

### id

```ts
id: any = item.id;
```

### message

```ts
message: ComputedRef<any>;
```

### meta

```ts
meta: ComputedRef<{
  isActive: any;
  isScheduled: any;
}>;
```

### state

```ts
state: any;
```
