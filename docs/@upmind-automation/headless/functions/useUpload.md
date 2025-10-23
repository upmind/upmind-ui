[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / useUpload

# useUpload()

```ts
function useUpload(field?): object;
```

Composable function to manage file uploads, providing state, context, and methods
for handling the upload process.

NB: System uploads are NOT a global instance and are always instantiated as a new machine
this is because we need to be able to have multiple uploads happening at once,
and we need to be able to start and stop them individually

## Parameters

### field?

`object`

## Returns

### add()

```ts
add: (value) => Promise<unknown>;
```

Add a new file to upload.

#### Parameters

##### value

`string`

The file path or URL to upload.

#### Returns

`Promise`\<`unknown`\>

Resolves with the file path or URL after upload.

#### Throws

If the upload fails or times out.

### created

```ts
created: ComputedRef<unknown>;
```

The creation date of the uploaded file, if available.

### errors

```ts
errors: ComputedRef<unknown>;
```

Any errors encountered during upload.

### file

```ts
file: ComputedRef<unknown>;
```

The uploaded file object, if present.

### getImage()

```ts
getImage: (type, typeId, isDefault) => State<UploadContext, AnyEventObject, any, {
  context: UploadContext;
  value: any;
}, ResolveTypegenMeta<TypegenDisabled, AnyEventObject, BaseActionObject, ServiceMap>>;
```

Load an image by type, typeId, and isDefault.

#### Parameters

##### type

`any`

The type of the image.

##### typeId

`any`

The ID of the type.

##### isDefault

`any`

Whether to load the default image.

#### Returns

`State`\<[`UploadContext`](../interfaces/UploadContext.md), `AnyEventObject`, `any`, \{
  `context`: [`UploadContext`](../interfaces/UploadContext.md);
  `value`: `any`;
\}, `ResolveTypegenMeta`\<`TypegenDisabled`, `AnyEventObject`, `BaseActionObject`, `ServiceMap`\>\>

Resolves when the image is loaded.

#### Throws

If the image cannot be found or loaded.

### getImageByHash()

```ts
getImageByHash: (hash) => void;
```

Load an image by its hash.

#### Parameters

##### hash

`any`

The hash of the image to load.

#### Returns

`void`

Resolves when the image is loaded.

#### Throws

If the image cannot be found or loaded.

### meta

```ts
meta: ComputedRef<{
  hasErrors: boolean;
  hasFile: boolean;
  isComplete: boolean;
  isLoading: boolean;
  isProcessing: boolean;
}>;
```

Meta information about the upload state.

### name

```ts
name: ComputedRef<unknown>;
```

The name of the uploaded file.

### remove()

```ts
remove: () => void;
```

Remove the uploaded file.

#### Returns

`void`

### src

```ts
src: ComputedRef<unknown>;
```

The source URL of the uploaded file.

### stop()

```ts
stop: () => boolean;
```

Stop the upload service.

#### Returns

`boolean`
