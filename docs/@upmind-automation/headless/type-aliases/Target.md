[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Target

# Target

```ts
type Target = 
  | ROUTE
  | {
  guard?: (route, data?) => Promise<boolean>;
  meta?: Record<string, any>;
  name: ROUTE | string;
  resolve?: (route, data?) => Promise<Route>;
};
```
