// -----------------------------------------------------------------------------
/**
 * @module config/config.conditions
 * @description Evaluator, validator, and state builder for conditional context settings.
 */

// --- utils
import {
  compact,
  concat,
  every,
  find,
  forEach,
  get,
  has,
  includes,
  isArray,
  isBoolean,
  isEmpty,
  isNil,
  isNumber,
  isPlainObject,
  keys,
  map,
  size,
  some,
  values
} from "lodash-es";

// --- types
import type { IProduct, IBasket } from "@upmind-automation/types";
import {
  ProductStateKey,
  BasketProductStateKey,
  BasketStateKey,
  ScalarOperator,
  ArrayOperator,
  type ConditionStateKey,
  type ComparisonOperator,
  type RuleCondition,
  type Rule,
  type ConditionalValue,
  type SettingValue,
  type ConditionState,
  type ConditionStateInputs,
  type ValidationIssue,
  type ValidationResult,
  type ValidationSeverity,
  type OperatorExpression,
  type BasketProductInput
} from "./types";
import { UIContext, UIScope, UI_META_DEFINITIONS } from "./schema";
import { PRE_BASKET_CONTEXTS, POST_BASKET_CONTEXTS } from "./schema/types";

// -----------------------------------------------------------------------------
// Type Guards
// -----------------------------------------------------------------------------

/**
 * Narrows a setting value to a `ConditionalValue<T>` shape (`{ default, rules }`).
 * Returns false for plain values (strings, numbers, etc.).
 */
export function isConditionalValue<T>(
  value: unknown
): value is ConditionalValue<T> {
  return (
    isPlainObject(value) &&
    has(value, "default") &&
    has(value, "rules") &&
    isArray((value as ConditionalValue<T>).rules)
  );
}

// -----------------------------------------------------------------------------
// Evaluator
// -----------------------------------------------------------------------------

/**
 * Resolves a `SettingValue` against a `ConditionState`.
 *
 * Returns the first rule's `then` whose `when` matches state; falls back to
 * `default` if no rule matches. A rule with no `when` is a catch-all and
 * always matches. Plain (non-conditional) values are returned as-is.
 */
export function evaluateRules<T>(
  value: SettingValue<T>,
  state: ConditionState
): T {
  if (!isConditionalValue<T>(value)) {
    return value as T;
  }

  let result: T = value.default;

  forEach(value.rules, (rule: Rule<T>) => {
    if (!rule.when || matchesCondition(rule.when, state)) {
      result = rule.then;
      return false;
    }
  });

  return result;
}

/**
 * Tests whether all keys in a condition match the given state.
 * Each key in `condition` is AND-ed; missing state values cause the rule to
 * silently skip (return false) so partial state never produces false positives.
 */
export function matchesCondition(
  condition: RuleCondition,
  state: ConditionState
): boolean {
  const conditionKeys = keys(condition) as ConditionStateKey[];

  return every(conditionKeys, (stateKey: ConditionStateKey) => {
    const stateValue = get(state, stateKey);
    const operatorExpr = get(condition, stateKey) as
      | OperatorExpression
      | undefined;

    if (isNil(stateValue) || isNil(operatorExpr)) {
      return false;
    }

    const operators = keys(operatorExpr) as ComparisonOperator[];

    return every(operators, (operator: ComparisonOperator) => {
      const operand = get(operatorExpr, operator);
      return evaluateOperator(stateValue, operator, operand);
    });
  });
}

/**
 * Applies a single comparison operator to a state value and operand.
 * Returns false (skip) on type mismatches and unknown operators —
 * `validateMeta` is responsible for surfacing those at save time.
 */
export function evaluateOperator(
  stateValue: unknown,
  operator: ComparisonOperator,
  operand: unknown
): boolean {
  switch (operator) {
    // --- Scalar operators
    case ScalarOperator.EQ:
      return stateValue === operand;

    case ScalarOperator.NE:
      return stateValue !== operand;

    case ScalarOperator.GT:
      if (!isNumber(stateValue) || !isNumber(operand)) return false;
      return stateValue > operand;

    case ScalarOperator.GTE:
      if (!isNumber(stateValue) || !isNumber(operand)) return false;
      return stateValue >= operand;

    case ScalarOperator.LT:
      if (!isNumber(stateValue) || !isNumber(operand)) return false;
      return stateValue < operand;

    case ScalarOperator.LTE:
      if (!isNumber(stateValue) || !isNumber(operand)) return false;
      return stateValue <= operand;

    case ScalarOperator.IN:
      if (!isArray(operand)) return false;
      return includes(operand, stateValue);

    case ScalarOperator.NIN:
      if (!isArray(operand)) return false;
      return !includes(operand, stateValue);

    // --- Array operators
    case ArrayOperator.CONTAINS:
      if (!isArray(stateValue)) return false;
      return includes(stateValue, operand);

    case ArrayOperator.CONTAINS_ANY:
      if (!isArray(stateValue) || !isArray(operand)) return false;
      return some(operand, (item: unknown) => includes(stateValue, item));

    case ArrayOperator.EXCLUDES:
      if (!isArray(stateValue)) return false;
      return !includes(stateValue, operand);

    case ArrayOperator.EMPTY:
      if (!isArray(stateValue)) return false;
      return operand === true ? isEmpty(stateValue) : !isEmpty(stateValue);

    // Unknown operators silently skip — `validateMeta` flags them at save time.
    default:
      return false;
  }
}

// -----------------------------------------------------------------------------
// State Builder
// -----------------------------------------------------------------------------

/**
 * Projects domain inputs (product, basketProduct, basket) into the flat
 * `ConditionState` shape used by `evaluateRules`. Keys with no resolvable
 * value are omitted so the evaluator can distinguish "missing" from "false".
 */
export function buildConditionState(
  inputs: ConditionStateInputs
): ConditionState {
  const { product, basketProduct, basket } = inputs;
  const state: ConditionState = {};

  const allKeys = concat<ConditionStateKey>(
    values(ProductStateKey),
    values(BasketProductStateKey),
    values(BasketStateKey)
  );

  forEach(allKeys, (key: ConditionStateKey) => {
    const value = resolveStateKey(key, product, basketProduct, basket);
    if (!isNil(value)) {
      state[key] = value;
    }
  });

  return state;
}

function resolveStateKey(
  key: ConditionStateKey,
  product?: IProduct,
  basketProduct?: BasketProductInput,
  basket?: IBasket
): string | number | boolean | string[] | undefined {
  switch (key) {
    // --- Product state keys
    case ProductStateKey.TRIAL_DAYS:
      return get(product, "trial_duration");

    case ProductStateKey.TERM_COUNT:
      return size(get(product, "prices", []));

    case ProductStateKey.OPTION_COUNT:
      return size(get(product, "products_options", []));

    case ProductStateKey.BCM:
      return get(product, "billing_cycle_months");

    // --- BasketProduct state keys
    case BasketProductStateKey.SUB_PIDS:
      return (
        get(basketProduct, "configuration.subproducts") ??
        compact(map(get(basketProduct, "options", []), "product_id"))
      );

    case BasketProductStateKey.BCM:
      return (
        get(basketProduct, "configuration.term") ??
        get(basketProduct, "billing_cycle_months")
      );

    case BasketProductStateKey.QTY:
      return (
        get(basketProduct, "configuration.quantity") ??
        get(basketProduct, "quantity")
      );

    case BasketProductStateKey.TOTAL:
      return (
        get(basketProduct, "price.currentAmount") ??
        get(basketProduct, "net_amount")
      );

    // --- Basket state keys
    case BasketStateKey.COUPONS:
      return map(get(basket, "promotions", []), "promotion.code");

    case BasketStateKey.TOTAL:
      return get(basket, "net_amount");

    case BasketStateKey.ITEM_COUNT:
      return size(get(basket, "products", []));

    case BasketStateKey.PIDS:
      return map(get(basket, "products", []), "product_id");

    default:
      return undefined;
  }
}

// -----------------------------------------------------------------------------
// Validator
// -----------------------------------------------------------------------------

/**
 * Stable identifiers for validator findings. Surfaced on each
 * `ValidationIssue.code` so callers can group/filter without parsing messages.
 */
export const ValidationCode = {
  UNKNOWN_SETTING: "UNKNOWN_SETTING",
  NOT_CONDITIONAL: "NOT_CONDITIONAL",
  INVALID_SCREEN: "INVALID_SCREEN",
  INVALID_SCOPE: "INVALID_SCOPE",
  UNKNOWN_STATE_KEY: "UNKNOWN_STATE_KEY",
  INVALID_OPERATOR: "INVALID_OPERATOR",
  OPERAND_TYPE_MISMATCH: "OPERAND_TYPE_MISMATCH",
  INVALID_RULE_SHAPE: "INVALID_RULE_SHAPE",
  MISSING_DEFAULT: "MISSING_DEFAULT",
  MISSING_RULES: "MISSING_RULES",
  LOCKED_SCREEN_OVERRIDE: "LOCKED_SCREEN_OVERRIDE",
  UNREACHABLE_RULE: "UNREACHABLE_RULE",
  SILENT_SKIP: "SILENT_SKIP",
  EMPTY_RULES: "EMPTY_RULES",
  NAMESPACE_SUGGESTION: "NAMESPACE_SUGGESTION",
  CATCH_ALL_NOT_LAST: "CATCH_ALL_NOT_LAST"
} as const;

const ALL_STATE_KEYS = concat<ConditionStateKey>(
  values(ProductStateKey),
  values(BasketProductStateKey),
  values(BasketStateKey)
);

const ALL_OPERATORS = concat<ComparisonOperator>(
  values(ScalarOperator),
  values(ArrayOperator)
);

const ARRAY_STATE_KEYS: ConditionStateKey[] = [
  BasketProductStateKey.SUB_PIDS,
  BasketStateKey.COUPONS,
  BasketStateKey.PIDS
];

/**
 * Validates a meta object's conditional rules without throwing.
 *
 * Walks each setting and checks rule shape, state key/operator/operand types,
 * and per-context availability. Returns a list of issues at error/warning/info
 * severity for callers to surface in editors or logs.
 */
export function validateMeta(params: {
  meta: Record<string, unknown>;
  context?: UIContext;
  scope?: UIScope;
}): ValidationResult {
  const { meta, context, scope } = params;
  const issues: ValidationIssue[] = [];

  forEach(meta, (value, key) => {
    const path = key;

    const definition = get(UI_META_DEFINITIONS, key);
    if (!definition) {
      issues.push(
        createIssue(
          "error",
          ValidationCode.UNKNOWN_SETTING,
          path,
          `Unknown setting: "${key}"`
        )
      );
      return;
    }

    if (
      context &&
      context !== UIContext.ALL &&
      !includes(definition.contexts, context)
    ) {
      issues.push(
        createIssue(
          "error",
          ValidationCode.INVALID_SCREEN,
          path,
          `Setting "${key}" does not apply to "${context}" screen`
        )
      );
      return;
    }

    if (scope && !includes(definition.scopes, scope)) {
      issues.push(
        createIssue(
          "error",
          ValidationCode.INVALID_SCOPE,
          path,
          `Setting "${key}" does not apply at "${scope}" scope`
        )
      );
      return;
    }

    if (context && definition.locked && has(definition.locked, context)) {
      const lockedValue = get(definition.locked, context);
      let hasDiffering = false;
      let differing: unknown;

      if (isConditionalValue(value)) {
        if (value.default !== lockedValue) {
          differing = value.default;
          hasDiffering = true;
        } else {
          const rule = find(
            value.rules,
            (r: Rule<unknown>) => r.then !== lockedValue
          );
          if (rule) {
            differing = rule.then;
            hasDiffering = true;
          }
        }
      } else if (value !== lockedValue) {
        differing = value;
        hasDiffering = true;
      }

      if (hasDiffering) {
        issues.push(
          createIssue(
            "warning",
            ValidationCode.LOCKED_SCREEN_OVERRIDE,
            path,
            `Setting is locked to "${lockedValue}" on "${context}" screen; authored "${differing}" will be ignored`
          )
        );
      }
    }

    if (!isConditionalValue(value)) {
      return;
    }

    if (!definition.conditional) {
      issues.push(
        createIssue(
          "error",
          ValidationCode.NOT_CONDITIONAL,
          path,
          `Setting "${key}" does not support conditional rules`
        )
      );
      return;
    }

    if (!has(value, "default")) {
      issues.push(
        createIssue(
          "error",
          ValidationCode.MISSING_DEFAULT,
          path,
          "Missing 'default' in conditional value"
        )
      );
    }

    if (!has(value, "rules") || !isArray(value.rules)) {
      issues.push(
        createIssue(
          "error",
          ValidationCode.MISSING_RULES,
          path,
          "Missing or invalid 'rules' array"
        )
      );
      return;
    }

    if (isEmpty(value.rules)) {
      issues.push(
        createIssue(
          "info",
          ValidationCode.EMPTY_RULES,
          path,
          "Rules array is empty; default will always be used"
        )
      );
    }

    let foundCatchAll = false;

    forEach(value.rules, (rule, index) => {
      const rulePath = `${path}.rules[${index}]`;

      if (!isPlainObject(rule)) {
        issues.push(
          createIssue(
            "error",
            ValidationCode.INVALID_RULE_SHAPE,
            rulePath,
            "Rule must be an object"
          )
        );
        return;
      }

      if (!has(rule, "then")) {
        issues.push(
          createIssue(
            "error",
            ValidationCode.INVALID_RULE_SHAPE,
            rulePath,
            "Rule must have a 'then' value"
          )
        );
        return;
      }

      if (foundCatchAll) {
        issues.push(
          createIssue(
            "warning",
            ValidationCode.UNREACHABLE_RULE,
            rulePath,
            "Rule is unreachable; a catch-all rule appears before it"
          )
        );
      }

      if (!rule.when || isEmpty(rule.when)) {
        foundCatchAll = true;
        if (index < size(value.rules) - 1) {
          issues.push(
            createIssue(
              "info",
              ValidationCode.CATCH_ALL_NOT_LAST,
              rulePath,
              "Catch-all rule (no 'when') should be last"
            )
          );
        }
        return;
      }

      validateCondition(rule.when, rulePath, context, issues);
    });
  });

  return { issues };
}

function validateCondition(
  condition: RuleCondition,
  basePath: string,
  context: UIContext | undefined,
  issues: ValidationIssue[]
): void {
  const conditionKeys = keys(condition) as string[];

  forEach(conditionKeys, (stateKey: string) => {
    const keyPath = `${basePath}.when["${stateKey}"]`;

    if (!includes(ALL_STATE_KEYS, stateKey)) {
      issues.push(
        createIssue(
          "error",
          ValidationCode.UNKNOWN_STATE_KEY,
          keyPath,
          `Unknown state key: "${stateKey}"`
        )
      );

      const suggestion = suggestNamespace(stateKey, context);
      if (suggestion) {
        issues.push(
          createIssue(
            "info",
            ValidationCode.NAMESPACE_SUGGESTION,
            keyPath,
            suggestion
          )
        );
      }
      return;
    }

    if (context) {
      const isPreBasket = includes(PRE_BASKET_CONTEXTS, context);
      const isPostBasket = includes(POST_BASKET_CONTEXTS, context);

      const keyNamespace = stateKey.split(".")[0];

      if (isPreBasket && keyNamespace === "basketProduct") {
        issues.push(
          createIssue(
            "info",
            ValidationCode.SILENT_SKIP,
            keyPath,
            `"${stateKey}" is not available on pre-basket screen "${context}"; rule will silently skip`
          )
        );
      }

      if (isPostBasket && keyNamespace === "product") {
        issues.push(
          createIssue(
            "info",
            ValidationCode.SILENT_SKIP,
            keyPath,
            `"${stateKey}" may not be available on post-basket screen "${context}"; rule may silently skip`
          )
        );
      }
    }

    const operatorExpr = get(condition, stateKey) as OperatorExpression;
    if (!isPlainObject(operatorExpr)) {
      issues.push(
        createIssue(
          "error",
          ValidationCode.INVALID_OPERATOR,
          keyPath,
          "Operator expression must be an object"
        )
      );
      return;
    }

    const operators = keys(operatorExpr);
    forEach(operators, (op: string) => {
      const opPath = `${keyPath}["${op}"]`;

      if (!includes(ALL_OPERATORS, op)) {
        issues.push(
          createIssue(
            "error",
            ValidationCode.INVALID_OPERATOR,
            opPath,
            `Unknown operator: "${op}"`
          )
        );
        return;
      }

      const operand = get(operatorExpr, op);
      validateOperandType(
        stateKey as ConditionStateKey,
        op as ComparisonOperator,
        operand,
        opPath,
        issues
      );
    });
  });
}

function validateOperandType(
  stateKey: ConditionStateKey,
  operator: ComparisonOperator,
  operand: unknown,
  path: string,
  issues: ValidationIssue[]
): void {
  const isArrayKey = includes(ARRAY_STATE_KEYS, stateKey);
  const isArrayOperator = includes(values(ArrayOperator), operator);

  if (isArrayOperator && !isArrayKey) {
    issues.push(
      createIssue(
        "warning",
        ValidationCode.OPERAND_TYPE_MISMATCH,
        path,
        `Array operator "${operator}" used on non-array state key "${stateKey}"`
      )
    );
  }

  if (
    !isArrayOperator &&
    isArrayKey &&
    operator !== ScalarOperator.EQ &&
    operator !== ScalarOperator.NE
  ) {
    issues.push(
      createIssue(
        "warning",
        ValidationCode.OPERAND_TYPE_MISMATCH,
        path,
        `Scalar operator "${operator}" may not work as expected on array state key "${stateKey}"`
      )
    );
  }

  if (
    (operator === ScalarOperator.IN || operator === ScalarOperator.NIN) &&
    !isArray(operand)
  ) {
    issues.push(
      createIssue(
        "error",
        ValidationCode.OPERAND_TYPE_MISMATCH,
        path,
        `Operator "${operator}" requires an array operand`
      )
    );
  }

  if (operator === ArrayOperator.CONTAINS_ANY && !isArray(operand)) {
    issues.push(
      createIssue(
        "error",
        ValidationCode.OPERAND_TYPE_MISMATCH,
        path,
        `Operator "${operator}" requires an array operand`
      )
    );
  }

  if (operator === ArrayOperator.EMPTY && !isBoolean(operand)) {
    issues.push(
      createIssue(
        "error",
        ValidationCode.OPERAND_TYPE_MISMATCH,
        path,
        `Operator "${operator}" requires a boolean operand`
      )
    );
  }
}

function suggestNamespace(
  stateKey: string,
  context: UIContext | undefined
): string | null {
  const parts = stateKey.split(".");
  if (parts.length !== 2) return null;

  const [namespace, property] = parts;

  const namespaceSwaps: Record<string, string> = {
    product: "basketProduct",
    basketProduct: "product",
    item: "basketProduct"
  };

  const suggestedNamespace = get(namespaceSwaps, namespace);
  if (!suggestedNamespace) return null;

  const suggestedKey = `${suggestedNamespace}.${property}`;

  if (includes(ALL_STATE_KEYS, suggestedKey)) {
    if (context) {
      const isPreBasket = includes(PRE_BASKET_CONTEXTS, context);
      if (isPreBasket && suggestedNamespace === "basketProduct") {
        return null;
      }
      const isPostBasket = includes(POST_BASKET_CONTEXTS, context);
      if (isPostBasket && suggestedNamespace === "product") {
        return `Did you mean "${suggestedKey}"? Note: product.* may not be available on "${context}"`;
      }
    }
    return `Did you mean "${suggestedKey}"?`;
  }

  return null;
}

function createIssue(
  severity: ValidationSeverity,
  code: string,
  path: string,
  message: string
): ValidationIssue {
  return { code, severity, path, message };
}
