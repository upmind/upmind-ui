// -----------------------------------------------------------------------------
/**
 * @fileoverview The package's own async boundary.
 *
 * ## Job To Be Done
 * Nothing on the barrel suspends: each async body sits behind a sync `<Suspense>` owner.
 *
 * ## What Breaks If These Fail
 * A host with no `<Suspense>` of its own renders a blank page, or a prop drops silently.
 */

import { describe, expect, it } from "vitest";
import {
  UpmAuthLogin,
  UpmAuthLogout,
  UpmAuthRecoverPassword,
  UpmAuthRegister
} from "../index";
import LoginView from "../views/Login.vue";
import RecoverPasswordView from "../views/RecoverPassword.vue";
import RegisterView from "../views/Register.vue";

// -----------------------------------------------------------------------------

function setupKind(component: { setup?: unknown }) {
  const { setup } = component;
  if (typeof setup !== "function") return "none";
  return setup.constructor.name;
}

const PUBLISHED = [
  UpmAuthLogin,
  UpmAuthRegister,
  UpmAuthRecoverPassword,
  UpmAuthLogout
];

const BOUNDARIES = [
  { owner: UpmAuthLogin, body: LoginView },
  { owner: UpmAuthRegister, body: RegisterView },
  { owner: UpmAuthRecoverPassword, body: RecoverPasswordView }
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
