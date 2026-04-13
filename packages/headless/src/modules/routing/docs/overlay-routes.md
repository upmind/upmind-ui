# Overlay Routes

Overlay routes render modals or drawers on top of the current page without replacing it. They use Vue Router's named routes and query parameters rather than dedicated pages.

## How It Works

Think of overlay routes like **pop-up windows** — the underlying page stays, and the overlay appears on top. When dismissed, you're right back where you were.

```
/basket/abc-123                   ← underlying route
/basket/abc-123/auth              ← overlay route (auth modal)
/basket/abc-123/auth?returnUrl=/basket/abc-123  ← with return URL
```

## Query Parameters

All overlay routes use the `QUERY_PARAMS` enum for type-safe parameter access:

```typescript
import { QUERY_PARAMS } from "@upmind-automation/types";

// Setting params
query: {
  [QUERY_PARAMS.RETURN_URL]: route.fullPath,
  [QUERY_PARAMS.CANCEL_URL]: "basket"
}

// Reading params
const { getParam } = useQueryParams(route);
const returnUrl = getParam(QUERY_PARAMS.RETURN_URL);
```

| Parameter   | Enum                      | Used By       | Purpose                           |
| ----------- | ------------------------- | ------------- | --------------------------------- |
| `returnUrl` | `QUERY_PARAMS.RETURN_URL` | `close()`     | Where to go after successful flow |
| `cancelUrl` | `QUERY_PARAMS.CANCEL_URL` | `dismiss()`   | Where to go when user cancels     |
| `bid`       | `QUERY_PARAMS.BASKET_ID`  | `guardBasket` | Basket identifier to load         |

## `useOverlayRoute` Composable

```typescript
import { useOverlayRoute } from "@upmind-automation/client-vue";

const {
  isOpen, // Whether an overlay is currently active
  isReady, // Whether the composable is ready
  overlayId, // The overlay identifier
  overlayType, // 'modal' | 'drawer'
  close, // Close after success → navigates to returnUrl
  dismiss // Dismiss (backdrop click) → navigates back or to cancelUrl
} = useOverlayRoute();
```

### `close()` — Flow Complete

Called after a successful flow (e.g., user logged in). Uses `router.replace()` to avoid adding stale overlay routes to browser history.

```typescript
function close(): void {
  const returnUrl = getParam(QUERY_PARAMS.RETURN_URL);
  if (returnUrl) {
    router.replace(returnUrl); // Replace overlay with return destination
  } else {
    router.replace(resolveParentRoute()); // Strip overlay segment
  }
}
```

### `dismiss()` — User Cancelled

Called when the user clicks the backdrop or presses Escape.

```typescript
function dismiss(): void {
  if (window.history.state?.back) {
    router.back(); // Go back if there's history
  } else {
    const cancelUrl = getParam(QUERY_PARAMS.CANCEL_URL);
    router.push(cancelUrl ? { name: cancelUrl } : resolveParentRoute());
  }
}
```

## Auth Overlay Flow

The most common overlay is the authentication modal on basket routes:

1. User navigates to `/basket/:bid`
2. `guardBasket` checks authentication
3. Not authenticated → rejects with `SESSION` route + `returnUrl`
4. Auth overlay renders at `/session?returnUrl=/basket/:bid`
5. User logs in
6. `close()` fires → `router.replace(returnUrl)` → back to basket
7. `guardBasket` re-runs → authenticated → basket loads

> **🧪 For Testers:**
>
> - Verify auth overlay appears when navigating to `/basket/:bid` while logged out
> - After login, verify you're returned to the basket (no extra page reload)
> - Press Escape or click backdrop — verify you're navigated away from the overlay

> **👩‍💻 For Developers:** Always use `QUERY_PARAMS` enum — never use raw string keys like `'returnUrl'`.

## BID Preservation

When redirecting through the auth overlay, the basket ID (BID) must survive the round-trip:

```typescript
// In guardBasket / ensureBidAuth:
return Promise.reject({
  target: {
    name: ROUTE.SESSION,
    params: { segment: "basket", bid: basketId },
    query: { [QUERY_PARAMS.RETURN_URL]: route.fullPath }
  }
} as FunnelResponse);
```

The `returnUrl` is the **full path** (e.g., `/order/basket/abc-123/`), which includes the BID. When `close()` navigates back to this path, the BID is automatically present.
