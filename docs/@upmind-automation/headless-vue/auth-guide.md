# Auth

The `useSession` composable provides an easy-to-use interface for managing session-related actions such as authentication, registration, and more using Vue. It simplifies the integration of session-based logic into your Vue application with reactive helpers and state management.

## API Reference

Please refer to the full API reference on `useSession` [here](./functions/useSession.md).

## Usage

To use the useSession composable in your Vue components, simply import it:

```js
import { useSession } from "@upmind-automation/headless";
```

### Setup in a Vue component

```vue
<template>
  <div>
    <form @submit.prevent="handleSubmit">
      <div v-if="meta.showLoginForm">
        <input v-model="formData.username" placeholder="Username" />
        <input
          v-model="formData.password"
          type="password"
          placeholder="Password"
        />
      </div>
      <div v-if="meta.showRegisterForm">
        <input v-model="formData.username" placeholder="Username" />
        <input v-model="formData.email" type="email" placeholder="Email" />
        <input
          v-model="formData.password"
          type="password"
          placeholder="Password"
        />
      </div>
      <button type="submit">Submit</button>
    </form>

    <div v-if="meta.isLoading">Loading...</div>
    <div v-if="meta.isAuthenticated">Logged In</div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useSession } from '@upmind-automation/headless';

  const { meta, resolve, reject } = useSession();

  const formData = ref({
    username: '',
    password: '',
    email: '',
  })

  function handleSubmit() {
    // Handles form submission based on the
    // current form state (login, register, 2FA).
    resolve(formData.value);
  }

  return {
    formData,
    meta,
    handleSubmit,
  }
}
</script>
```

## Examples

Please find a list of some common use cases that can be handled by the `useSession` composable.

### Logging in a User

```js
import { ref } from "vue";
import { useSession } from "@/composables/useSession";

export default {
  setup() {
    const { login } = useSession();

    const formData = ref({
      username: "testuser",
      password: "password123",
    });

    // Perform login
    login(formData.value);
  },
};
```

### Handling 2FA Verification

```js
import { ref } from "vue";
import { useSession } from "@/composables/useSession";

export default {
  setup() {
    const { verify2fa } = useSession();

    const token = ref("");

    // Verify 2FA token
    verify2fa({ token: token.value });
  },
};
```

### Perform login and 2FA Verification

```vue
<template>
  <div>
    <!-- Login Form -->
    <div v-if="meta.showLoginForm && !meta.show2fa">
      <h2>Login</h2>
      <form @submit.prevent="submitLogin">
        <input v-model="loginData.username" placeholder="Username" required />
        <input
          v-model="loginData.password"
          type="password"
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>

    <!-- 2FA Verification Form -->
    <div v-if="meta.show2fa">
      <h2>2FA Verification</h2>
      <form @submit.prevent="submit2fa">
        <input v-model="twoFaToken" placeholder="Enter 2FA Token" required />
        <button type="submit">Verify 2FA</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useSession } from "@upmind-automation/headless";

const { login, verify2fa, meta } = useSession();

const loginData = ref({
  username: "",
  password: "",
});
const twoFaToken = ref("");

// Handle submit of the login form
const submitLogin = () => {
  login(loginData.value);
};

// Handle submit of the 2FA form
const submit2fa = () => {
  verify2fa({ token: twoFaToken.value });
};
</script>
```

You'll notice that `meta.show2fa` will be automatically updated at the right time (after the user tries to login in). This is `@upmind-automation/headless` doing the heavy lifting for a smooth developer experience.

### Handling Errors

You can check for validation errors by observing the `errors` property:

```vue
<div v-if="errors">
  <ul>
    <li v-for="error in errors" :key="error">{{ error }}</li>
  </ul>
</div>
```

## Advanced Usage

### `meta` Object Options

The `meta` object contains various reactive properties that provide useful information about the current session state. Below is a list of available options:

| Property           | Type      | Description                                                                             |
| ------------------ | --------- | --------------------------------------------------------------------------------------- |
| `isLoading`        | `Boolean` | Indicates if the session or any child machines (guest/client) are in a loading state.   |
| `isProcessing`     | `Boolean` | Indicates if the session is in a processing state (e.g., during login or registration). |
| `isAuthenticated`  | `Boolean` | Indicates if the user is authenticated (client state).                                  |
| `isTransferring`   | `Boolean` | Indicates if the client session is in the process of transferring data.                 |
| `hasExpired`       | `Boolean` | Indicates if the session has expired.                                                   |
| `showReCaptcha`    | `Boolean` | Indicates if a ReCaptcha challenge is required (e.g., during registration).             |
| `showLoginForm`    | `Boolean` | Indicates if the login form should be displayed.                                        |
| `show2fa`          | `Boolean` | Indicates if the 2FA (Two-Factor Authentication) challenge is required during login.    |
| `showRegisterForm` | `Boolean` | Indicates if the registration form should be displayed.                                 |
| `canShowForms`     | `Boolean` | Indicates if any forms (login or register) can be shown.                                |

These properties can be used to conditionally render forms and/or loading indicators based on the session state.

### JSON Forms

This composable also provides `schema` and `uischema`, which can be used by JSON Forms to automatically generate a login/register form.

Here's a simple example on how to use them:

```vue
<template>
  <div>
    <h2>User Registration Form</h2>
    <json-forms
      v-if="schema && uischema"
      :schema="schema"
      :uischema="uischema"
      :data="formData"
      @change="onChange"
    />
    <button @click="submitForm">Submit</button>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { JsonForms } from "@jsonforms/vue";
import { useSession } from "@upmind-automation/headless";

const { meta, schema, uischema, resolve, errors } = useSession();

const formData = ref({});

// Handle form submission
const submitForm = () => {
  resolve(formData.value);
  if (errors.value) {
    console.error("Form errors:", errors.value);
  }
};

// Handle form value changes
const onChange = ({ data }) => {
  formData.value = data;
};
</script>
```

In the example above, we're using JSON Forms Vue Integration, please refer to their [documentation](https://jsonforms.io/docs/integrations/vue/) for more information.

### Inspecting Session State

You can provide an inspector function to log session state changes, useful for debugging.

```js
import { useSession } from "@/composables/useSession";

export default {
  setup() {
    const inspector = info => {
      console.log("Session Info:", info);
    };

    const { login } = useSession(inspector);

    // Log session state changes and perform login
    login({ username: "testuser", password: "password123" });
  },
};
```
