/**
 * @fileoverview `file-responsibility` — ESLint rules pinning each module
 * concern to its named file, for `packages/headless` (FE-3249). Retires the
 * file-naming prose in `code-typescript.companion.md` / `code-services.companion.md`
 * to mechanical rules. Every exception is structural (the machine-service
 * signature), so no rule needs an `eslint-disable`.
 *
 *   query-only-in-services — useQuery/useMutation live only in *.services.ts
 *   services-purity        — a services fn is a request, a machine service, or a delegate
 *   types-in-types-file    — exported type/interface/enum only in *.types.ts
 *   no-type-reexport       — no type re-export from another module
 *   schemas-in-schema-file — *Schema/*Uischema only in *.schemas.ts
 *   mappers-in-mapper-file — map / parse exports only in mappers files (machine-fn exempt)
 *   barrel-only-reexports  — a module index.ts holds curated re-exports only
 *   barrel-curated-exports — no `export *` of an @internal file, no unrenamed default re-export
 *   no-fn-in-types-file    — a types file holds no function
 *   no-state-outside-layers — no ref/reactive/computed/watch or module store in services, utils, mappers
 *   no-promise-wrap        — no `new Promise` in a services file or a machine's guards
 *   internal-file-marker   — an internal file starts with `/** @internal *\/`
 *   no-own-barrel-import   — a module never imports its own barrel
 *   machine-sibling-names  — machine services/actions/guards live in {module}.{kind}.{ctx?}.ts
 *   module-prefixed-names  — a headless module file starts with `<module>.` or `use`
 *
 * @module packages/eslint-plugin-file-responsibility
 */

import queryOnlyInServices from "./rules/query-only-in-services.mjs";
import servicesPurity from "./rules/services-purity.mjs";
import typesInTypesFile from "./rules/types-in-types-file.mjs";
import noTypeReexport from "./rules/no-type-reexport.mjs";
import schemasInSchemaFile from "./rules/schemas-in-schema-file.mjs";
import mappersInMapperFile from "./rules/mappers-in-mapper-file.mjs";
import consistentTypeDefinitions from "./rules/consistent-type-definitions.mjs";
import barrelOnlyReexports from "./rules/barrel-only-reexports.mjs";
import barrelCuratedExports from "./rules/barrel-curated-exports.mjs";
import noFnInTypesFile from "./rules/no-fn-in-types-file.mjs";
import noStateOutsideLayers from "./rules/no-state-outside-layers.mjs";
import noPromiseWrap from "./rules/no-promise-wrap.mjs";
import internalFileMarker from "./rules/internal-file-marker.mjs";
import noOwnBarrelImport from "./rules/no-own-barrel-import.mjs";
import machineSiblingNames from "./rules/machine-sibling-names.mjs";
import modulePrefixedNames from "./rules/module-prefixed-names.mjs";

const plugin = {
  meta: { name: "file-responsibility", version: "1.0.0" },
  rules: {
    "query-only-in-services": queryOnlyInServices,
    "services-purity": servicesPurity,
    "types-in-types-file": typesInTypesFile,
    "no-type-reexport": noTypeReexport,
    "schemas-in-schema-file": schemasInSchemaFile,
    "mappers-in-mapper-file": mappersInMapperFile,
    "consistent-type-definitions": consistentTypeDefinitions,
    "barrel-only-reexports": barrelOnlyReexports,
    "barrel-curated-exports": barrelCuratedExports,
    "no-fn-in-types-file": noFnInTypesFile,
    "no-state-outside-layers": noStateOutsideLayers,
    "no-promise-wrap": noPromiseWrap,
    "internal-file-marker": internalFileMarker,
    "no-own-barrel-import": noOwnBarrelImport,
    "machine-sibling-names": machineSiblingNames,
    "module-prefixed-names": modulePrefixedNames
  }
};

export default plugin;
