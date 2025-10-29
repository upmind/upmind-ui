[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / messageDisplays

# messageDisplays

Enumeration defining the various display methods for messages within the UI.
This dictates how and where a message (e.g. error, success notification) will be presented to the user.

## Enumeration Members

### AUTH

```ts
AUTH: "auth";
```

Message specifically related to authentication (e.g. login, registration) flows.

***

### MODAL

```ts
MODAL: "modal";
```

Message displayed within a "modal" dialogue, requiring user interaction to dismiss.

***

### NOTIFICATION

```ts
NOTIFICATION: "notification";
```

Message displayed as a more persistent "notification", often in a dedicated notification area or sidebar.

***

### SILENT

```ts
SILENT: "";
```

Message is not displayed visually. This can be used for logging or internal processing only.

***

### SNACKBAR

```ts
SNACKBAR: "snackbar";
```

Message displayed as a "snackbar", a brief, non-intrusive message bar at the bottom of the screen.

***

### SYSTEM

```ts
SYSTEM: "system";
```

Message integrated directly into the "system" interface, e.g. embedded error messages in forms.

***

### TOAST

```ts
TOAST: "toast";
```

Message displayed as a temporary "toast" notification, usually appearing at the top or bottom of the screen.
