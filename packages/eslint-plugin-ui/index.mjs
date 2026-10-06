/**
 * @fileoverview `ui` — the ESLint plugin enforcing the composed-component laws
 * (CC*) for `design-system/packages/ui`, replacing the `code-ui.companion.md`
 * prose (FE-3247). Each rule is one former CC law; scoping to the composed
 * components lives in the root `eslint.config.mjs`, not in the rules.
 *
 * Rule → CC law (see docs/plans/FE-3247.md disposition table):
 *   folder-grammar               — CC-B  (Lint 5)
 *   no-parts-import              — CC-C  (Lint 6)
 *   no-inline-sfc-types          — CC4   (Lint 4)
 *   no-cva-in-composed           — CC3a  (Lint 7)
 *   controlled-boolean-undefined — CC6   (Lint 8)
 *   test-attrs-key               — CC9/CC10 (Lint 9)
 *   simple-template-conditions   — CC12a (Lint 10)
 *   no-direct-slots-access       — CC14  (Lint 11)
 *   no-v-for-index-key           — CC18  (Lint 12)
 *   no-as-child-prop             — CC19  (Lint 13)
 *   require-accessible-name      — CC20  (Lint 14)
 *   require-empty-state          — CC21  (Lint 15)
 *   no-english-default           — CC22  (Lint 16)
 *   require-story-and-registry   — CC24/CC25 (Lint 17)
 *   class-strings-placement      — CC26  (Lint 18)
 *   define-options-name          — CC1a  (Lint 20)
 *   slot-return-vnode            — CC5b  (Lint 21)
 *   test-attrs-in-template       — CC8b  (Lint 22)
 *   named-clauses-single-expression — CC13a (Lint 23)
 *   no-lodash-in-components      — CC13b (Lint 25)
 *   no-label-derived-test-id     — P9 (test id never derived from a label)
 *   single-object-v-bind         — test-id contract (one object v-bind per element)
 *   v-html-sanitised             — v-html only through a sanitiser call
 *   no-bound-style               — no bound :style (custom properties allowed)
 *   pascal-case-file-name        — a .vue file base name is PascalCase
 *   script-setup-order           — script-setup sections in order
 *   typed-define-model           — defineModel carries a type argument
 *   no-nuxt-auto-import          — no explicit import of a Nuxt auto-imported name
 *   token-classes                — only token utilities in class strings
 *   multi-root-attrs             — a multi-root template binds $attrs
 *   uischema-i18n                — each uischema element carries an i18n key
 *   parts-exported               — a component index.ts exports its parts (CC1b)
 *   item-slot-scope              — a slot inside v-for passes its item
 *   module-anatomy               — a modules-* src/ keeps to the UI module anatomy
 *   lazy-route-component         — a route component is a dynamic import
 *   uischema-spelling            — the identifier spelling is `Uischema`
 *
 * @module packages/eslint-plugin-ui
 */

import folderGrammar from "./rules/folder-grammar.mjs";
import noPartsImport from "./rules/no-parts-import.mjs";
import noInlineSfcTypes from "./rules/no-inline-sfc-types.mjs";
import noCvaInComposed from "./rules/no-cva-in-composed.mjs";
import controlledBooleanUndefined from "./rules/controlled-boolean-undefined.mjs";
import testAttrsKey from "./rules/test-attrs-key.mjs";
import simpleTemplateConditions from "./rules/simple-template-conditions.mjs";
import noDirectSlotsAccess from "./rules/no-direct-slots-access.mjs";
import noVForIndexKey from "./rules/no-v-for-index-key.mjs";
import noAsChildProp from "./rules/no-as-child-prop.mjs";
import requireAccessibleName from "./rules/require-accessible-name.mjs";
import requireEmptyState from "./rules/require-empty-state.mjs";
import noEnglishDefault from "./rules/no-english-default.mjs";
import requireStoryAndRegistry from "./rules/require-story-and-registry.mjs";
import classStringsPlacement from "./rules/class-strings-placement.mjs";
import defineOptionsName from "./rules/define-options-name.mjs";
import slotReturnVnode from "./rules/slot-return-vnode.mjs";
import testAttrsInTemplate from "./rules/test-attrs-in-template.mjs";
import namedClausesSingleExpression from "./rules/named-clauses-single-expression.mjs";
import noLodashInComponents from "./rules/no-lodash-in-components.mjs";
import noLabelDerivedTestId from "./rules/no-label-derived-test-id.mjs";
import singleObjectVBind from "./rules/single-object-v-bind.mjs";
import vHtmlSanitised from "./rules/v-html-sanitised.mjs";
import noBoundStyle from "./rules/no-bound-style.mjs";
import pascalCaseFileName from "./rules/pascal-case-file-name.mjs";
import scriptSetupOrder from "./rules/script-setup-order.mjs";
import typedDefineModel from "./rules/typed-define-model.mjs";
import noNuxtAutoImport from "./rules/no-nuxt-auto-import.mjs";
import tokenClasses from "./rules/token-classes.mjs";
import multiRootAttrs from "./rules/multi-root-attrs.mjs";
import uischemaI18n from "./rules/uischema-i18n.mjs";
import partsExported from "./rules/parts-exported.mjs";
import itemSlotScope from "./rules/item-slot-scope.mjs";
import moduleAnatomy from "./rules/module-anatomy.mjs";
import lazyRouteComponent from "./rules/lazy-route-component.mjs";
import uischemaSpelling from "./rules/uischema-spelling.mjs";

const plugin = {
  meta: { name: "ui", version: "1.0.0" },
  rules: {
    "folder-grammar": folderGrammar,
    "no-parts-import": noPartsImport,
    "no-inline-sfc-types": noInlineSfcTypes,
    "no-cva-in-composed": noCvaInComposed,
    "controlled-boolean-undefined": controlledBooleanUndefined,
    "test-attrs-key": testAttrsKey,
    "simple-template-conditions": simpleTemplateConditions,
    "no-direct-slots-access": noDirectSlotsAccess,
    "no-v-for-index-key": noVForIndexKey,
    "no-as-child-prop": noAsChildProp,
    "require-accessible-name": requireAccessibleName,
    "require-empty-state": requireEmptyState,
    "no-english-default": noEnglishDefault,
    "require-story-and-registry": requireStoryAndRegistry,
    "class-strings-placement": classStringsPlacement,
    "define-options-name": defineOptionsName,
    "slot-return-vnode": slotReturnVnode,
    "test-attrs-in-template": testAttrsInTemplate,
    "named-clauses-single-expression": namedClausesSingleExpression,
    "no-lodash-in-components": noLodashInComponents,
    "no-label-derived-test-id": noLabelDerivedTestId,
    "single-object-v-bind": singleObjectVBind,
    "v-html-sanitised": vHtmlSanitised,
    "no-bound-style": noBoundStyle,
    "pascal-case-file-name": pascalCaseFileName,
    "script-setup-order": scriptSetupOrder,
    "typed-define-model": typedDefineModel,
    "no-nuxt-auto-import": noNuxtAutoImport,
    "token-classes": tokenClasses,
    "multi-root-attrs": multiRootAttrs,
    "uischema-i18n": uischemaI18n,
    "parts-exported": partsExported,
    "item-slot-scope": itemSlotScope,
    "module-anatomy": moduleAnatomy,
    "lazy-route-component": lazyRouteComponent,
    "uischema-spelling": uischemaSpelling
  }
};

export default plugin;
