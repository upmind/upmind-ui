/**
 * @module foundation/shell
 * @description The shell socket: ADR 023 §7, Amendment 1 change 3.
 *
 * Amendment 1 change 3 makes the shell — page, layouts, header, footer —
 * app-owned, so a domain organism may not import the template it renders
 * inside. `graphify query "what imports the client-vue session module"` over
 * graphify-out/graph.json shows those templates reached only from the session
 * organisms, and the shell primitives they compose reached from every other
 * client-vue module too. Injecting the map keeps the organism free of the
 * shell while the shell keeps its single home.
 */
import type { Component } from "vue";

/** The shell components a host offers a domain organism, keyed by name. */
export type ShellComponents = Record<string, Component>;
