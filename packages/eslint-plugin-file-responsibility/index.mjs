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

const plugin = {
  meta: { name: "file-responsibility", version: "1.0.0" },
  rules: {
    "query-only-in-services": queryOnlyInServices,
    "services-purity": servicesPurity,
    "types-in-types-file": typesInTypesFile,
    "no-type-reexport": noTypeReexport,
    "schemas-in-schema-file": schemasInSchemaFile,
    "mappers-in-mapper-file": mappersInMapperFile,
    "consistent-type-definitions": consistentTypeDefinitions
  }
};

export default plugin;
