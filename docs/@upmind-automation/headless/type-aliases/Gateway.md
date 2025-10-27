[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / Gateway

# Gateway

```ts
type Gateway = object;
```

## Properties

### cardTypes

```ts
cardTypes: IGateway["card_types"];
```

***

### currencies

```ts
currencies: IGateway["currencies"];
```

***

### gatewayProvider

```ts
gatewayProvider: IGateway["gateway_provider"];
```

***

### gatewaySettings

```ts
gatewaySettings: IGateway["gateway_settings"];
```

***

### id

```ts
id: IGateway["id"];
```

***

### instructions

```ts
instructions: IGateway["payment_instructions"];
```

***

### meta

```ts
meta: object;
```

#### canStore

```ts
canStore: boolean;
```

#### isStored

```ts
isStored: boolean;
```

#### mustStore

```ts
mustStore: boolean;
```

#### useFrontendImplementation?

```ts
optional useFrontendImplementation: boolean;
```

***

### paymentType

```ts
paymentType: IGateway["payment_type"];
```

***

### provider

```ts
provider: IGateway["provider"];
```

***

### title

```ts
title: IGateway["name"];
```

***

### type

```ts
type: GatewayTypes;
```
