// zod-json-bridge.ts
import { z, type ZodType } from "zod";
import { zodToJsonSchema as zodToJsonSchemaLib } from "@alcyone-labs/zod-to-json-schema";

import { jsonSchemaToZod as jsonSchemaToZodLib } from "json-schema-to-zod";

/* -------------------------------------------------------------------------- */
/*  Derive types from the actual library functions                           */
/* -------------------------------------------------------------------------- */

type ZodToJsonSchemaLib = typeof zodToJsonSchemaLib;
type JsonSchemaFromZod = ReturnType<ZodToJsonSchemaLib>;
type ZodToJsonSchemaSchemaParam = Parameters<ZodToJsonSchemaLib>[0];
type ZodToJsonSchemaOptionsParam = Parameters<ZodToJsonSchemaLib>[1];

type JsonSchemaToZodLib = typeof jsonSchemaToZodLib;
type JsonToZodSchemaParam = Parameters<JsonSchemaToZodLib>[0];
type JsonToZodOptionsParam = Parameters<JsonSchemaToZodLib>[1];

/* -------------------------------------------------------------------------- */
/*  Our typed JSON Schema wrapper                                             */
/* -------------------------------------------------------------------------- */

/**
 * JSON Schema that the two libs understand, with a phantom generic `T`
 * to track the TypeScript type it describes.
 */
export type JsonSchema<T = unknown> = JsonSchemaFromZod & {
  /** Phantom marker; not used at runtime. */
  __type?: T;
};

/* -------------------------------------------------------------------------- */
/*  Zod -> JSON Schema                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Zod -> JSON Schema (typed)
 *
 * - Input: any Zod v4 schema (ZodType)
 * - Options: exactly whatever zodToJsonSchemaLib accepts as its second param
 * - Output: JSON Schema plus a phantom generic for z.output<S>
 */
export function zodToJson<S extends ZodType>(
  zodSchema: S & ZodToJsonSchemaSchemaParam, // ensure it's compatible with the lib
  options?: ZodToJsonSchemaOptionsParam
): JsonSchema<z.output<S>> {
  if (!zodSchema || typeof zodSchema.parse !== "function") {
    throw new Error("Invalid Zod schema: schema must have a parse function");
  }

  const jsonSchema = zodToJsonSchemaLib(zodSchema as ZodToJsonSchemaSchemaParam, options as ZodToJsonSchemaOptionsParam);

  // Ensure draft-07 $schema is set, which json-schema-to-zod expects.
  if (typeof jsonSchema === "object" && jsonSchema !== null && !("$schema" in jsonSchema)) {
    (jsonSchema as any).$schema = "http://json-schema.org/draft-07/schema#";
  }

  return jsonSchema as JsonSchema<z.output<S>>;
}

/* -------------------------------------------------------------------------- */
/*  JSON Schema -> Zod                                                        */
/* -------------------------------------------------------------------------- */

/**
 * JSON Schema -> Zod (typed)
 *
 * - Input: whatever jsonSchemaToZodLib accepts *plus* an optional phantom `T`
 * - Options: jsonSchemaToZodLib options, minus the module/import/type knobs
 * - Output: ZodType<T>
 *
 * If the schema came from `zodToJson(schema)`, then T is `z.output<typeof schema>`.
 * Otherwise, you can annotate `TypedJsonSchema<T>` and we trust you.
 */
export function jsonToZod<T = unknown>(
  jsonSchema: (JsonSchema<T> & JsonToZodSchemaParam) | JsonToZodSchemaParam,
  options?: Omit<NonNullable<JsonToZodOptionsParam>, "module" | "noImport" | "type">
): ZodType<T> {
  if (!jsonSchema || typeof jsonSchema !== "object") {
    throw new Error("Invalid JSON Schema: must be an object");
  }

  const zodCode = jsonSchemaToZodLib(jsonSchema as JsonToZodSchemaParam, {
    module: "none", // emit an expression, no imports/exports
    noImport: true, // don't generate `import { z } from "zod"`
    type: false, // don't emit TS types
    ...(options as JsonToZodOptionsParam),
  });

  // Runtime: compile a small JS snippet like `z.object({ ... })`
  const createSchema = new Function("z", `return ${zodCode};`) as (arg: unknown) => unknown;

  const schema = createSchema(z) as ZodType<T>;
  return schema;
}

/* -------------------------------------------------------------------------- */
/*  Convenience wrapper                                                       */
/* -------------------------------------------------------------------------- */

export const ZOD_JSON = {
  zodToJson,
  jsonToZod,
};
