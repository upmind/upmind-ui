/**
 * @module catalogue/types
 * @description The host's page templates for the browse organism.
 */
import type { Component } from "vue";

export enum CATALOGUE_TEMPLATE {
  FULL = "full"
}

/** The host's page templates, one per `CATALOGUE_TEMPLATE`. */
export type CatalogueTemplates = Record<CATALOGUE_TEMPLATE, Component>;
