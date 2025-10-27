[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / DomainTypes

# DomainTypes

Enumeration defining the different types of domain management flows.
These types dictate the user interface, available actions, and underlying logic
for how a customer interacts with domain names, e.g. registering a new one,
transferring an existing one, or using one from their basket.

## Enumeration Members

### basket

```ts
basket: "basket";
```

Represents the flow where a customer selects a domain name that is **already present in their shopping basket**.
Used for multistep checkouts or when combining items.

***

### existing

```ts
existing: "existing";
```

Represents the flow where a customer chooses to **use an existing domain name** they already own,
without transferring it. They will typically update nameservers manually.

***

### register

```ts
register: "register";
```

Represents the flow for **registering a new domain name**.
Used when a customer wants to acquire an available domain.

***

### transfer

```ts
transfer: "transfer";
```

Represents the flow for **transferring an existing domain name** from another registrar.
Used when a customer wants to consolidate domain management under Upmind.
