/**
 * @module foundation/shell
 * @description The shell socket: a host hands a domain organism the shell it renders inside.
 */
import type { Component } from "vue";

export type ShellComponents = Record<string, Component>;

export type UseShellComponents = {
  resolve: (name: string) => Component | undefined;
};
