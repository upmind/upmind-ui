// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/surfaces/record/record.utils
 * @description Reading a declared cell against one record: whether the record
 * carries a drawable value for it, and the width it takes; and which of a
 * declared list of notices the record says.
 */

import { unref } from "vue";
import { columnWidthClasses } from "../../../scenario.styles";
import {
  RecordActionColorTypes,
  TableColumnWidthTypes
} from "../../../scenario.types";
import {
  isAbsentDate,
  isRuleVisible,
  resolveScope
} from "../../../scenario.utils";
import {
  castArray,
  compact,
  every,
  filter,
  find,
  get,
  isArray,
  isEmpty,
  isNil,
  isPlainObject,
  join,
  mapValues,
  replace,
  some,
  toString,
  trimEnd,
  values
} from "lodash-es";
import type {
  RecordNoticeDeclaration,
  TableCell
} from "../../../scenario.types";
import type { RecordControl } from "../RecordSurface.types";
import type { RecordGateReader } from "./record.types";

// -----------------------------------------------------------------------------

/**
 * Whether the record carries a drawable value for this cell. A date descriptor
 * with no real date is absent, so a zero date never draws as "127 years ago".
 */
export function isPopulated(
  element: TableCell,
  model: Record<string, unknown>
): boolean {
  const value = resolveScope(model, element.scope);

  if (isNil(value) || value === "") return false;
  if (element.type === "TableCellDate") return !isAbsentDate(value);
  if (element.type === "TableCellBadges")
    return some(element.options.badges, badge =>
      badge.scope
        ? !!resolveScope(model, badge.scope)
        : !!get(value, badge.flag)
    );
  if (isArray(value)) return !isEmpty(value);
  if (isPlainObject(value)) return some(values(value), part => !!part);

  return true;
}

/** The cells a record draws: those its rule shows and it carries a value for. */
export function drawableCells(
  elements: TableCell[],
  model: Record<string, unknown>
): TableCell[] {
  return filter(
    elements,
    element => isRuleVisible(element, model) && isPopulated(element, model)
  );
}

/**
 * The width class a record field takes — the share its `options.width`
 * declares, through the table's own map; absent, a quarter. Every share is a
 * whole number of twelfths, so mixed widths flow onto one 12-column grid.
 */
export function fieldWidth(element: TableCell): string {
  const width = element.options?.width;
  return columnWidthClasses[width ?? TableColumnWidthTypes.QUARTER];
}

/**
 * A record route, with its `:id` filled and the page's own scope suffix
 * (`as/client`) carried over so the next page boots at the same actor.
 *
 * @param template A path template — `/useContractProduct/:id`.
 * @param id The record the route addresses.
 * @param suffix The current route's `scopeSuffix` param.
 */
export function recordPath(
  template: string,
  id: string | undefined,
  suffix: unknown
): string {
  const path = trimEnd(replace(template, ":id", id ?? ""), "/");
  const segments = compact(isArray(suffix) ? suffix : [suffix]) as string[];
  return segments.length ? `${path}/${join(segments, "/")}` : path;
}

/** The link tint of a bound control: a destructive write reads as danger. */
export function linkColor(control: RecordControl): "danger" | "muted" {
  return control.color === RecordActionColorTypes.DANGER ? "danger" : "muted";
}

/** The first notice whose every gate opens; none, the record says nothing. */
export function openNotice(
  notices: RecordNoticeDeclaration[] | undefined,
  allows: RecordGateReader
): RecordNoticeDeclaration | undefined {
  return find(notices, notice =>
    every(castArray(notice.gate ?? []), gate => allows(gate))
  );
}

/** A notice's i18n params, each read off the record model as text. */
export function noticeValues(
  notice: RecordNoticeDeclaration,
  model: Record<string, unknown>
): Record<string, string> {
  return mapValues(notice.values, scope =>
    toString(unref(resolveScope(model, scope)))
  );
}
