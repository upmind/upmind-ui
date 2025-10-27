[Upmind](../../packages.md) / [@upmind-automation/headless](../index.md) / User

# User

Interface representing the profile and authentication details of an authenticated user.

## Properties

### avatar

```ts
avatar: object;
```

Avatar configuration for the user.

#### caption

```ts
caption: string;
```

The caption or initials displayed on the avatar.

#### forceCaption

```ts
forceCaption: boolean;
```

`true` to force the display of the caption even if an image URL is present.

#### src

```ts
src: string | undefined;
```

The URL of the user's avatar image.

***

### display

```ts
display: string;
```

A computed string for displaying the user's name (e.g. "John Doe").

***

### email

```ts
email: string;
```

The primary email address of the user.

***

### firstname

```ts
firstname: string;
```

The user's first name.

***

### fullname

```ts
fullname: string;
```

The user's full name.

***

### id

```ts
id: string;
```

The unique identifier of the user.

***

### lastname

```ts
lastname: string;
```

The user's last name.

***

### locale

```ts
locale: string;
```

The user's preferred interface language code (e.g. "en-GB").

***

### name

```ts
name: string;
```

The user's name (full name or preferred display name).

***

### username

```ts
username: string;
```

The user's username for login.
