Generate a multiple-choice quiz in JSON format for the GrinDev platform.

## Output format

Return ONLY valid JSON. No markdown, no explanation, no code fences. The JSON must match this exact structure:

{
"title": "<descriptive quiz title>",
"topic": "<TOPIC>",
"difficulty": "<DIFFICULTY>",
"questions": [
{
"question": "<question text>",
"code": "<optional code block, omit field if not needed>",
"options": ["<option A>", "<option B>", "<option C>", "<option D>"],
"correctIndex": <0|1|2|3>,
"explanation": "<why the correct answer is correct, shown to users who answer wrong>"
}
]
}

## Valid values

topic: JAVASCRIPT | TYPESCRIPT | PYTHON | CSS | HTML | REACT | NODE | DATABASES | SYSTEM_DESIGN | GENERAL_CS
difficulty: EASY | MEDIUM | HARD

## Requirements

- Generate exactly {count} questions (default: 8 if not specified)
- Every question must have exactly 4 options
- correctIndex must be 0, 1, 2, or 3 (0 = option A)
- All 4 options must be plausible — no obvious filler answers
- Include code blocks for questions involving syntax, output prediction, or debugging
- Keep code blocks concise — max 6 lines
- Explanations must be clear and educational — explain WHY, not just WHAT
- Vary question types: definitions, output prediction, best practices, gotchas, comparisons
- Do NOT repeat the same concept twice
- Questions should be self-contained — no references to "the previous question"

## Difficulty guidelines

EASY:

- Core syntax and basic concepts
- Common built-in methods
- Simple output prediction
- Example: typeof, array methods, variable scoping basics

MEDIUM:

- Closures, prototypes, async/await
- Edge cases and gotchas
- Less common but important patterns
- Example: event loop order, Promise chaining, prototype chain

HARD:

- Advanced internals and optimization
- Complex async patterns, memory management
- Design patterns, performance tradeoffs
- Example: WeakRef, generator functions, custom iterators

## Topic-specific guidance

JAVASCRIPT: Focus on ECMAScript features, event loop, closures, prototypes, type coercion
TYPESCRIPT: Type system, generics, utility types, declaration merging, strict mode
PYTHON: List comprehensions, decorators, generators, GIL, type hints
CSS: Box model, specificity, flexbox/grid, cascade, custom properties
REACT: Hooks rules, rendering behavior, reconciliation, context, performance
NODE: Event loop, streams, modules (ESM vs CJS), Buffer, child_process
DATABASES: SQL joins, indexing, transactions, normalization, NoSQL tradeoffs
SYSTEM_DESIGN: CAP theorem, caching strategies, load balancing, API design patterns
GENERAL_CS: Data structures, algorithms complexity, OS concepts, networking basics

## Example request

Generate 8 MEDIUM JavaScript questions about closures, the event loop, and prototype chain.

## Example question with code

{
"question": "What is logged to the console?",
"code": "for (var i = 0; i < 3; i++) {\n setTimeout(() => console.log(i), 0);\n}",
"options": ["0 1 2", "3 3 3", "0 0 0", "undefined undefined undefined"],
"correctIndex": 1,
"explanation": "var is function-scoped, so all three setTimeout callbacks share the same i variable. By the time they execute, the loop has finished and i is 3."
}
