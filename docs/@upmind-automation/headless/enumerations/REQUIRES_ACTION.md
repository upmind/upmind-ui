[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / REQUIRES\_ACTION

# REQUIRES\_ACTION

Enumeration representing various states or conditions that may require an action to be taken by the user or system.
This is often used in contexts like product configuration, order validation, or resource management.

## Enumeration Members

### INVALID

```ts
INVALID: "invalid";
```

Indicates that the current state or configuration is invalid and corrective action is required.
For example, missing required fields in a form or an incompatible product selection.

***

### PENDING

```ts
PENDING: "pending";
```

Indicates that an action is pending and has not yet been completed.
For example, a product configuration awaiting user input or a service provisioning awaiting completion.

***

### RELATED

```ts
RELATED: "related";
```

Indicates that the state is related to another entity or process and may require attention.
For example, a product might require action if a related domain or hosting service has an issue.
