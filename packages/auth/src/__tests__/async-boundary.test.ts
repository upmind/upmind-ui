// -----------------------------------------------------------------------------
/**
 * @fileoverview The package's own async boundary — ADR 023 §3 export seam
 *
 * ## Job To Be Done
 * Each session organism's body awaits headless readiness, so the file the barrel
 * and the route records name must be a SYNC sibling that owns the `<Suspense>`
 * and takes its fallback from this package's loading seam. The async body stays
 * private under `views/`. Eight more domain packages clone this shape, so the
 * contract is pinned once, here: nothing on the barrel suspends, every async
 * body sits behind a boundary, and the body's prop contract crosses it intact.
 *
 * ## What Breaks If These Fail
 * An async organism published on the barrel suspends with no boundary above it,
 * so every host that forgets a `<Suspense>` of its own renders a blank page —
 * the empty body a green build cannot see. A boundary that re-declares props
 * rather than carrying them drops a prop silently on the package's main public
 * surface, and the host loses prop checking on the component it mounts.
 */

import { describe, expect, it } from "vitest";
import {
  UpmSessionLogin,
  UpmSessionLogout,
  UpmSessionRecoverPassword,
  UpmSessionRegister
} from "../index";
import LoginView from "../views/Login.vue";
import RecoverPasswordView from "../views/RecoverPassword.vue";
import RegisterView from "../views/Register.vue";

// -----------------------------------------------------------------------------

/** `<script setup>` carrying a top-level await compiles to an async `setup`. */
function setupKind(component: { setup?: unknown }) {
  const { setup } = component;
  if (typeof setup !== "function") return "none";
  return setup.constructor.name;
}

const PUBLISHED = [
  UpmSessionLogin,
  UpmSessionRegister,
  UpmSessionRecoverPassword,
  UpmSessionLogout
];

const BOUNDARIES = [
  { owner: UpmSessionLogin, body: LoginView },
  { owner: UpmSessionRegister, body: RegisterView },
  { owner: UpmSessionRecoverPassword, body: RecoverPasswordView }
];

describe("the auth package's async boundary", () => {
  it("publishes no component that suspends", () => {
    for (const component of PUBLISHED) {
      expect(setupKind(component)).toBe("Function");
    }
  });

  it("keeps each async body private behind its boundary", () => {
    for (const { owner, body } of BOUNDARIES) {
      expect(setupKind(body)).toBe("AsyncFunction");
      expect(owner).not.toBe(body);
    }
  });

  it("carries the body's whole prop contract across the boundary", () => {
    for (const { owner, body } of BOUNDARIES) {
      expect(owner.props).toEqual(body.props);
    }
  });
});
