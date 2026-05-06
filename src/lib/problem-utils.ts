import type { Prisma } from "@prisma/client";
import { ProblemExample } from "@/types";

export function parseProblemExamples(
  value: Prisma.JsonValue,
): ProblemExample[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Prisma.JsonObject => {
      return typeof item === "object" && item !== null && !Array.isArray(item);
    })
    .map((item) => ({
      input: typeof item.input === "string" ? item.input : "",
      output: typeof item.output === "string" ? item.output : "",
      explanation:
        typeof item.explanation === "string" ? item.explanation : undefined,
    }))
    .filter((example) => example.input && example.output);
}
