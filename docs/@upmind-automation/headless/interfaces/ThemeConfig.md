[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ThemeConfig

# ThemeConfig

Interface representing the overall theme configuration, mapping component names
to their respective [ThemeConfigValue](../type-aliases/ThemeConfigValue.md) settings. This allows for granular
styling of different parts of the UI.

## Example

```ts
{
  button: {
    variants: { intent: 'primary', size: 'medium' },
    colour: 'blue'
  },
  input: {
    border: { colorInput: '#CCCCCC' }
  }
}
```

## Indexable

```ts
[component: string]: ThemeConfigValue
```

A key-value map where keys are component identifiers (e.g. "button", "input")
and values are their configurations (either direct values or nested objects).
