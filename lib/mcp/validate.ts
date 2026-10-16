/**
 * Minimal argument validation for the flat JSON Schemas our tools declare.
 * Errors are returned to the model as a tool error (isError) so it can correct
 * the call, as the MCP spec recommends for input validation failures.
 */

type Schema = {
  type?: string | string[];
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean | Schema;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  items?: Schema;
};

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

function matchesType(value: unknown, type: string | string[] | undefined): boolean {
  if (!type) return true;
  const actual = typeOf(value);
  const allowed = Array.isArray(type) ? type : [type];
  return allowed.some((t) => t === actual || (t === "number" && actual === "integer"));
}

export function validateArguments(schema: Schema, args: unknown): string[] {
  const errors: string[] = [];
  if (args === undefined || args === null) args = {};
  if (typeOf(args) !== "object") return ["Arguments must be a JSON object."];
  const record = args as Record<string, unknown>;

  for (const name of schema.required ?? []) {
    if (record[name] === undefined) errors.push(`Missing required argument "${name}".`);
  }

  for (const [name, value] of Object.entries(record)) {
    const property = schema.properties?.[name];
    if (!property) {
      if (schema.additionalProperties === false) errors.push(`Unknown argument "${name}".`);
      continue;
    }
    if (!matchesType(value, property.type)) {
      errors.push(`Argument "${name}" must be ${Array.isArray(property.type) ? property.type.join(" or ") : property.type}.`);
      continue;
    }
    if (property.enum && !property.enum.includes(value)) {
      errors.push(`Argument "${name}" must be one of: ${property.enum.map(String).join(", ")}.`);
    }
    if (typeof value === "number") {
      if (property.minimum !== undefined && value < property.minimum) errors.push(`Argument "${name}" must be at least ${property.minimum}.`);
      if (property.maximum !== undefined && value > property.maximum) errors.push(`Argument "${name}" must be at most ${property.maximum}.`);
    }
  }
  return errors;
}
