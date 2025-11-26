import { z, ZodType } from "zod";
import { zodToJsonSchema as zodToJsonSchemaLib } from "@alcyone-labs/zod-to-json-schema";
import { jsonSchemaToZod as jsonSchemaToZodLib } from "json-schema-to-zod";

export interface ZodToJsonSchemaOptions {
  target?: "jsonSchema7" | "openApi3";
  $refStrategy?: "none" | "root" | "relative";
  name?: string;
}

function zodToJson(zodSchema: ZodType, options?: ZodToJsonSchemaOptions): any {
  if (!zodSchema || typeof zodSchema.parse !== "function") {
    throw new Error("Invalid Zod schema: schema must have a parse function");
  }

  const jsonSchema = zodToJsonSchemaLib(zodSchema, {
    target: options?.target || "jsonSchema7",
    $refStrategy: options?.$refStrategy || "none",
    ...(options?.name && { name: options.name }),
  });

  if (!jsonSchema.$schema) {
    jsonSchema.$schema = "http://json-schema.org/draft-07/schema#";
  }

  return jsonSchema;
}

function jsonToZod(jsonSchema: any): ZodType {
  if (!jsonSchema || typeof jsonSchema !== "object") {
    throw new Error("Invalid JSON Schema: must be an object");
  }

  const zodCode = jsonSchemaToZodLib(jsonSchema);

  const createSchema = new Function("z", `return ${zodCode}`);
  return createSchema(z);
}

export const ZOD_JSON = {
  zodToJson,
  jsonToZod,
};
