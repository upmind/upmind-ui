[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / IAuthTransfer

# IAuthTransfer

Interface representing the data for an authenticated session transfer.
This is used to securely transfer session context between different parts
of an application or between micro-frontends.

## Properties

### actor\_id

```ts
actor_id: string;
```

The unique identifier of the actor (user or client) performing the transfer.

***

### actor\_type

```ts
actor_type: AccessRoleTypes;
```

The type of actor involved in the transfer (e.g. 'client', 'user').

***

### client\_id

```ts
client_id: string;
```

The unique identifier of the client associated with the transfer.

***

### code

```ts
code: string;
```

The one-time transfer code generated for the session.

***

### redirect\_url

```ts
redirect_url: string;
```

The URL to which the client should be redirected after a successful transfer.
