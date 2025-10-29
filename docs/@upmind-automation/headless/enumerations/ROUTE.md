[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / ROUTE

# ROUTE

Enumeration representing predefined application routes and navigational paths.
These routes are used consistently throughout the Upmind frontend for navigation,
deep linking, and managing application state transitions.

## Enumeration Members

### BASKET

```ts
BASKET: "basket";
```

The route for viewing the shopping basket contents.

***

### CATALOGUE

```ts
CATALOGUE: "catalogue";
```

The route for the main product catalogue or shop page.

***

### CHECKOUT

```ts
CHECKOUT: "checkout";
```

The route for the checkout process.

***

### EMPTY

```ts
EMPTY: "empty";
```

The route for an empty shopping basket.

***

### ERROR

```ts
ERROR: "error";
```

Represents an error state, displayed when an unrecoverable error occurs.

***

### EXPRESS\_CHECKOUT

```ts
EXPRESS_CHECKOUT: "express.checkout";
```

The route for an express checkout flow.

***

### EXPRESS\_PRODUCT\_ADD

```ts
EXPRESS_PRODUCT_ADD: "express.product.add";
```

The route for quickly adding a product in an express flow.

***

### LOADING

```ts
LOADING: "loading";
```

Represents a loading state, typically displayed while data is being fetched or processed.

***

### ORDER

```ts
ORDER: "order";
```

The route for viewing a completed order.

***

### PRODUCT\_ADD

```ts
PRODUCT_ADD: "product.add";
```

The route for adding a new product.

***

### PRODUCT\_EDIT

```ts
PRODUCT_EDIT: "product.edit";
```

The route for editing an existing product.

***

### PRODUCT\_NOT\_FOUND

```ts
PRODUCT_NOT_FOUND: "product.notFound";
```

The route displayed when a requested product cannot be found.

***

### PRODUCT\_RECOMMENDATIONS

```ts
PRODUCT_RECOMMENDATIONS: "product.recommendations";
```

The route for displaying product recommendations.

***

### PRODUCT\_REQUIRES\_ACTION

```ts
PRODUCT_REQUIRES_ACTION: "product.requiresAction";
```

The route to display products that require specific actions from the user.

***

### RECOMMENDATIONS

```ts
RECOMMENDATIONS: "recommendations";
```

Generic route for product recommendation flows.

***

### REDIRECT\_EXTERNAL

```ts
REDIRECT_EXTERNAL: "redirect.external";
```

The route indicating a redirection to an external URL.

***

### REDIRECT\_INTERNAL

```ts
REDIRECT_INTERNAL: "redirect.internal";
```

The route indicating a redirection to an internal application route.

***

### SESSION

```ts
SESSION: "session";
```

The base route for session and authentication related pages.

***

### SESSION\_END

```ts
SESSION_END: "session.end";
```

The route indicating the end of a session, typically after logout.

***

### SESSION\_LOGIN

```ts
SESSION_LOGIN: "session.login";
```

The route for the user login page.

***

### SESSION\_RECOVER\_PASSWORD

```ts
SESSION_RECOVER_PASSWORD: "session.recover";
```

The route for the password recovery/reset page.

***

### SESSION\_REGISTER

```ts
SESSION_REGISTER: "session.register";
```

The route for the user registration page.

***

### SESSION\_TRANSFER

```ts
SESSION_TRANSFER: "session.transfer";
```

The route for handling session transfer operations between contexts.

***

### UNAVAILABLE

```ts
UNAVAILABLE: "unavailable";
```

Represents an unavailable state, indicating a resource or feature is not currently accessible.
