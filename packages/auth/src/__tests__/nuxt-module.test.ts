// -----------------------------------------------------------------------------
/**
 * @fileoverview The auth Nuxt adapter — ADR 023 §9
 *
 * ## Job To Be Done
 * `@upmind-automation/auth/nuxt` is the ONLY place Nuxt may appear for this
 * package, and it is how a Nuxt app installs the feature: a `auth: {}` block in
 * `nuxt.config` must reach the module, its options must survive into
 * `runtimeConfig.public` where the client plugin reads them, and exactly one
 * plugin must be added, on both server and client.
 *
 * ## What Breaks If These Fail
 * The app's `auth` config block is ignored, so the routes mount at the wrong
 * base or the hand-back guard never arms; or a second plugin registration
 * installs the feature twice and the routes are contributed twice over.
 */

import { runWithNuxtContext } from "nuxt/kit";
import { describe, expect, it } from "vitest";
import authNuxtModule from "../../nuxt";
import type { AuthFeatureOptions } from "../index";
import type { Nuxt } from "nuxt/schema";

// -----------------------------------------------------------------------------

/** A Nuxt double: this module only reads options and adds one plugin. */
function makeNuxt(): Nuxt {
  const double = {
    options: {
      runtimeConfig: { public: {} },
      plugins: [],
      alias: {},
      build: { transpile: [] },
      modules: [],
      imports: { dirs: [] },
      rootDir: process.cwd(),
      srcDir: process.cwd(),
      buildDir: `${process.cwd()}/.nuxt`,
      _installedModules: []
    },
    hooks: { hook: () => {}, callHook: async () => {} },
    hook: () => {},
    callHook: async () => {}
  };
  return double as unknown as Nuxt;
}

async function install(options: AuthFeatureOptions) {
  const nuxt = makeNuxt();
  await runWithNuxtContext(nuxt, () => authNuxtModule(options, nuxt));
  return nuxt;
}

describe("the auth Nuxt module", () => {
  it("binds the nuxt.config block a host writes as `auth`", async () => {
    const meta = await authNuxtModule.getMeta?.();

    expect(meta?.configKey).toBe("auth");
    expect(meta?.name).toBe("@upmind-automation/auth");
  });

  it("carries the host's options into the public runtime config", async () => {
    const nuxt = await install({
      routes: true,
      base: "/account",
      returnTarget: true
    });

    expect(nuxt.options.runtimeConfig.public.auth).toEqual({
      routes: true,
      base: "/account",
      returnTarget: true
    });
  });

  it("carries a host's opt-out just as faithfully", async () => {
    const nuxt = await install({ routes: false });

    expect(nuxt.options.runtimeConfig.public.auth).toMatchObject({
      routes: false
    });
  });

  it("adds exactly one plugin, on server and client alike", async () => {
    const nuxt = await install({ routes: true });

    expect(nuxt.options.plugins).toHaveLength(1);
    expect(nuxt.options.plugins[0]).toMatchObject({ mode: "all" });
  });

  it("adds a plugin that ships inside this package", async () => {
    const nuxt = await install({ routes: true });

    expect(nuxt.options.plugins[0]).toMatchObject({
      src: expect.stringContaining("packages/auth/src/nuxt/")
    });
  });
});
