## Introduction

Tiny helpers to convert between **Zod schemas** and **JSON Schema**.

This package gives you a small, typed API:

- `zodToJson(zodSchema, options?)` → JSON Schema
- `jsonToZod(jsonSchema)` → Zod schema (`ZodType`)

and wraps a few gotchas (validation, defaults, `$schema` field, etc.).

---

## Install

```bash
npm install @bigbang-sdk/zod-json
# or
yarn add @bigbang-sdk/zod-json
# or
pnpm add @bigbang-sdk/zod-json
```

---

## Quick Start

### 1. Convert Zod → JSON Schema

```ts
import { z } from "zod";
import { ZOD_JSON } from "@bigbang-sdk/zod-json"; // adjust to your actual package name

const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  age: z.number().int().min(0).optional(),
});

const jsonSchema = ZOD_JSON.zodToJson(userSchema);

console.log(JSON.stringify(jsonSchema, null, 2));
```

`zodToJson`:

- Validates that `userSchema` looks like a Zod schema (has a `.parse` function).
- Calls `zodToJsonSchemaLib` under the hood.

### 2. Convert JSON Schema → Zod

```ts
import { ZOD_JSON } from "zod-json";

const jsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    age: { type: "integer", minimum: 0 },
  },
  required: ["id", "name"],
};

const zodSchema = ZOD_JSON.jsonToZod(jsonSchema);

// Now use it like any Zod schema:
zodSchema.parse({
  id: "00000000-0000-0000-0000-000000000000",
  name: "Alice",
});
```

`jsonToZod`:

- Validates the input is an object.
- Uses `json-schema-to-zod` to generate Zod code as a string.
- Builds a Zod schema at runtime using `new Function("z", ...)`.
