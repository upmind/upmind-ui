[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / UploadContext

# UploadContext

Interface representing the context for managing file uploads, typically used with an XState machine.
This context holds information about the upload field, allowed file types, progress,
request/response details, and any errors encountered.

## Properties

### error?

```ts
optional error: ResponseError;
```

An error object if any issue occurred during the file upload process.

***

### field

```ts
field: object;
```

Details about the file input field, including its type, ID, and default status.

#### field\_id

```ts
field_id: string;
```

The unique identifier of the file input field.

#### field\_is\_default

```ts
field_is_default: boolean;
```

`true` if this is the default file input field.

#### field\_type

```ts
field_type: ImageObjectTypes;
```

The type of the field, usually an ImageObjectTypes or similar enum indicating the expected file type.

***

### file?

```ts
optional file: string | null;
```

The file itself, or its name/identifier, if selected or uploaded.

***

### fileTypes

```ts
fileTypes: string[];
```

An array of allowed file types for the upload, specified as MIME types or file extensions (e.g. `['image/png', 'image/jpeg']`).

***

### name?

```ts
optional name: string | null;
```

The name of the uploaded file.

***

### progress

```ts
progress: number;
```

The current progress of the file upload, represented as a percentage (0-100).

***

### request?

```ts
optional request: any;
```

The `request` object associated with the file upload, if available.

***

### response?

```ts
optional response: any;
```

The `response` object received after the file upload, if available.

***

### src?

```ts
optional src: string | null;
```

The URL of the uploaded file, if available after successful upload.
