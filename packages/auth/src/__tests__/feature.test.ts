// -----------------------------------------------------------------------------
/**
 * @fileoverview The auth feature contribution — ADR 023 §2 registry-ownership, §8
 *
 * ## Job To Be Done
 * `foundation` ships its registries EMPTY; the entries belong to the
 * contributing package. This spec drives that contract from the outside: a host
 * that registers this package's `defineFeature` gets the auth routes and the
 * flow registrar on `foundation`'s sockets, honouring the options a host passes
 * — and a host that already owns its auth pages can decline the routes and keep
 * the flows.
 *
 * ## What Breaks If These Fail
 * The routes never reach the router, so every auth page 404s; or the auth
 * package contributes pages a host did not ask for, and cart's own login path
 * is shadowed by the package's.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { useFeatures, useRouting } from "@upmind-automation/foundation";
import authFeature from "../feature";
import { AUTH_ROUTE, clientAuthFeature, defineAuthFeature } from "../index";
import type { AuthFeatureOptions } from "../index";
import type { RouteRecordRaw } from "vue-router";

// -----------------------------------------------------------------------------

/** The meta flag the flow registrar's guard keys on. */
const RETURN_TARGET_META = "authReturnTarget";

function install(options?: AuthFeatureOptions) {
  useFeatures().register(defineAuthFeature(options));
  useFeatures().install();
  return useRouting();
}

function childNames(record: RouteRecordRaw | undefined) {
  return (record?.children ?? []).map(child => child.name);
}

describe("the auth feature contribution", () => {
  beforeEach(() => {
    useFeatures().reset();
  });

  it("announces itself so a host can ask whether auth is installed", () => {
    useFeatures().register(clientAuthFeature);

    expect(useFeatures().has("auth")).toBe(true);
  });

  it("is what feature.ts default-exports", () => {
    expect(authFeature).toMatchObject({ name: "auth" });
    expect(authFeature).toBe(clientAuthFeature);
  });

  it("puts the whole auth route tree on the routing socket", () => {
    const routing = install();
    const root = routing.routes.value.find(
      record => record.name === AUTH_ROUTE.ROOT
    );

    expect(root?.path).toBe("/auth");
    expect(childNames(root)).toEqual([
      AUTH_ROUTE.LOGIN,
      AUTH_ROUTE.REGISTER,
      AUTH_ROUTE.RECOVER,
      AUTH_ROUTE.END
    ]);
  });

  it("registers exactly one flow registrar", () => {
    const routing = install();

    expect(routing.flows.value).toHaveLength(1);
  });

  it("withholds its routes from a host that owns its own auth pages", () => {
    const routing = install({ routes: false });

    expect(routing.routes.value).toEqual([]);
    expect(routing.flows.value).toHaveLength(1);
  });

  it("carries the host's base through to the contributed records", () => {
    const routing = install({ base: "/account" });

    expect(routing.routes.value.map(record => record.path)).toEqual([
      "/account"
    ]);
  });

  it("carries the host's return-target opt-in through to the records", () => {
    const routing = install({ returnTarget: true });
    const root = routing.routes.value.find(
      record => record.name === AUTH_ROUTE.ROOT
    );

    expect(root?.meta).toMatchObject({ [RETURN_TARGET_META]: true });
    for (const child of root?.children ?? []) {
      expect(child.meta).toMatchObject({ [RETURN_TARGET_META]: true });
    }
  });

  it("contributes nothing until a host installs it", () => {
    useFeatures().register(clientAuthFeature);

    expect(useRouting().routes.value).toEqual([]);
    expect(useRouting().flows.value).toEqual([]);
  });
});
