[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Locale

# Locale

Interface representing a collection of loaded locale messages.
The keys are locale codes (e.g. "en-GB", "es"), and their values are
objects containing translation keys and their corresponding strings.

 Locale

## Indexable

```ts
[localeCode: string]: Record<string, string>
```

Index signature allowing dynamic access by locale code.
Each locale code maps to an object where keys are message paths and values are translated strings.

### Example

```JSON
{
  "en": {
    "hello": "Hello",
    "welcome": "Welcome to our app"
  },
  "es": {
    "hello": "Hola",
    "welcome": "Bienvenido a nuestra aplicación"
  }
}
```
