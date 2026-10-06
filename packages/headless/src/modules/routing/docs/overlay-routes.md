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
import { useQueryParams } from "@upmind-automation/headless";
import { QUERY_PARAMS } from "@upmind-automation/types";
import { useRoute } from "vue-router";

const route = useRoute();

// Setting params — on a funnel's reject target
const target = {
  name: "session",
  query: {
    [QUERY_PARAMS.RETURN_URL]: route.fullPath,
    [QUERY_PARAMS.CANCEL_URL]: "basket"
  }
};

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

<!-- corpus-example: skip — useOverlayRoute is a host-app composable (shell/components/overlays/useOverlayRoute.ts in each app). No workspace package exports it, so the import resolves only inside the app -->
```typescript
import { useOverlayRoute } from "@/shell/components/overlays/useOverlayRoute";

const {
  isOpen, // Whether an overlay is currently active
  isReady, // Whether the composable is ready
  overlayId, // The overlay identifier
  overlayType, // 'modal' | 'drawer'
  close, // Close after success → navigates to returnUrl
  dismiss // Dismiss (backdrop click) → navigates to cancelUrl, back, or parent
} = useOverlayRoute();
```

### `close()` — Flow Complete

Called after a successful flow (e.g., user logged in). Uses `router.replace()` to avoid adding stale overlay routes to browser history.

```typescript
import { QUERY_PARAMS, useQueryParams } from "@upmind-automation/headless";
import { find } from "lodash-es";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const { getParam } = useQueryParams();

/** The nearest matched non-overlay ancestor. */
function resolveParentRoute() {
  const parent = find(
    [...route.matched].reverse(),
    r => !!r.name && !r.meta?.overlay
  );
  return parent
    ? { name: parent.name as string, params: route.params }
    : { path: "/" };
}

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

Called when the user clicks the backdrop or presses Escape. `cancelUrl` is checked **first**, and it is read off the **live** route:

- A funnel that names where cancelling lands has said something the history stack cannot.
- `useQueryParams()` snapshots the route at call time, and this composable is set up once in the app shell — so without passing the live `route`, what it read was the route the app booted on.

```typescript
import { QUERY_PARAMS, useQueryParams } from "@upmind-automation/headless";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

declare function resolveParentRoute(): { name: string } | { path: string };

function dismiss(): void {
  const cancelUrl = useQueryParams(route).getParam(QUERY_PARAMS.CANCEL_URL);

  if (cancelUrl) router.push({ name: cancelUrl });
  else if (window.history.state?.back) router.back();
  else router.push(resolveParentRoute());
}
```

Going back first was a bug: it sent a guarded page's overlay into the guard that opened it, which re-targets the overlay — so the close control, ESC and the backdrop all appeared to do nothing at all.

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
import {
  QUERY_PARAMS,
  useQueryParams,
  useRoutingEngine
} from "@upmind-automation/headless";
import type {
  FunnelContext,
  FunnelResponse
} from "@upmind-automation/headless";
import type { RouteLocation } from "vue-router";

enum ROUTE {
  BASKET = "basket",
  SESSION = "session"
}

// In guardBasket / ensureBidAuth:
async function ensureBidAuth(context: FunnelContext): Promise<never> {
  const route = (context.targetRoute ?? context.currentRoute) as RouteLocation;
  const { getParam } = useQueryParams(route);
  const { router } = useRoutingEngine();

  const basketId = getParam(QUERY_PARAMS.BASKET_ID);
  const returnUrl =
    route?.fullPath ??
    router.resolve({ name: ROUTE.BASKET, params: { bid: basketId } }).fullPath;

  return Promise.reject({
    target: {
      name: ROUTE.SESSION,
      params: { segment: "basket", bid: basketId },
      query: { [QUERY_PARAMS.RETURN_URL]: returnUrl }
    }
  } as FunnelResponse);
}
```

The `returnUrl` is the **full path** (e.g., `/order/basket/abc-123/`), which includes the BID. When `close()` navigates back to this path, the BID is automatically present.
