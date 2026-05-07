```

Generate DSA problems in the following JSON format.

Return a valid JSON array only.

Do not include markdown fences.

Do not include explanations outside the JSON.

Do not include comments outside JSON.

The output must be parseable by JSON.parse().

Each problem must follow this exact structure:

{

  "title": "string",

  "slug": "string",

  "functionName": "string",

  "difficulty": "EASY | MEDIUM | HARD",

  "topics": ["TOPIC_ENUM"],

  "description": "string",

  "examples": [

    {

      "input": "string",

      "output": "string",

      "explanation": "string"

    }

  ],

  "constraints": "string",

  "starterCode": {

    "JAVASCRIPT": "string",

    "TYPESCRIPT": "string",

    "PYTHON": "string",

    "CPP": "string",

    "JAVA": "string"

  },

  "testCases": [

    {

      "input": "string",

      "expected": "string"

    }

  ],

  "hints": [

    {

      "tier": 1,

      "cost": 1,

      "content": "string"

    },

    {

      "tier": 2,

      "cost": 3,

      "content": "string"

    },

    {

      "tier": 3,

      "cost": 7,

      "content": "string"

    },

    {

      "tier": 4,

      "cost": 15,

      "content": "string"

    }

  ]

}

Problem generation requirements:

1. Generate exactly 15 problems.

2. Difficulty distribution:

- 5 EASY

- 5 MEDIUM

- 5 HARD

3. Topic requirements:

Use only these topic enum values:

ARRAYS, STRINGS, LINKED_LISTS, TREES, GRAPHS, DYNAMIC_PROGRAMMING, SORTING, BINARY_SEARCH, STACK_QUEUE, HASH_MAP, HEAPS, TWO_POINTERS, SLIDING_WINDOW, DFS_BFS, BACKTRACKING, GREEDY, RECURSION, DIVIDE_AND_CONQUER, BIT_MANIPULATION, MATH, TRIE, UNION_FIND, SEGMENT_TREE, FENWICK_TREE, MONOTONIC_STACK, MONOTONIC_QUEUE

Each problem must include at least one topic.

If I request a main topic, every problem must include that topic.

You may add secondary topics if they are accurate.

4. Theme requirements:

Create problems with interesting, friendly, real-life scenarios.

Use varied settings such as:

- traditional culture

- food from different countries

- festivals

- daily life

- travel

- music

- games

- markets

- school

- cafe or restaurant situations

- famous movies, songs or events

Avoid generic names like "Two Sum", "Maximum Subarray", or "Find Duplicate".

Instead, wrap the algorithm in a memorable scenario.

5. Title and slug:

- title must be human-friendly and unique.

- slug must be unique, kebab-case, lowercase, and contain no special characters except hyphens.

- functionName must be camelCase and match the problem title meaning.

Example:

title: "Taco Truck Rush Window"

slug: "taco-truck-rush-window"

functionName: "tacoTruckRushWindow"

6. Description:
- Must be written in Markdown.
- Must clearly explain the story and task.
- Use backticks for variable names like `nums`, `target`, `orders`.
- Use bold for important concepts when useful.
- Do not include an Examples section in description.
- Do not include a Constraints section in description.
- Keep the problem statement concise but clear.
- For MEDIUM and HARD problems, include expected complexity when it is necessary to prevent brute-force solutions from being accepted.
- If the problem relies on already sorted input, repeated queries, large input size, or avoiding brute force, explicitly say what complexity is expected.

7. Examples:

Each problem must have 1 to 3 examples.

Each example must contain:

- input: human-readable Markdown string, for example "`orders = [3, 5, 2]`, `limit = 5`"

- output: Markdown string, for example "`10`"

- explanation: optional, but prefer including it for clarity.

8. Constraints:
Must be a Markdown bullet list string.

The constraints must support the intended difficulty.
For example:
- If a brute-force `O(n^2)` solution should not pass, use `n` up to `10^5`.
- If the intended solution is heap-based for `k` sorted lists, include large `k` and total `N`.
- If the intended solution is binary search on answer, include a large numeric range.

You may include an expected complexity bullet when useful:
- Expected time complexity: `O(N log k)`
- Expected space complexity: `O(k)`

9. Starter code:

Each language must include a complete runnable skeleton with only the function signature and a short comment.

Do not include the solution in starterCode.

JAVASCRIPT:

Use this style:

function functionName(arg1, arg2) {

  // Write your solution here.

}

TYPESCRIPT:

Use explicit types.

PYTHON:

Use snake_case function name and typing imports when needed.

CPP:

Include necessary #include lines and using namespace std.

Function name should use camelCase.

JAVA:

Use class Solution and put the method inside it.

10. Test cases:

Each problem must include at least 4 test cases.

Prefer 5 to 6 test cases when useful.

testCases.input rules:

- It must contain one JSON argument per line.

- Each argument must be valid JSON.

- For one argument:

  input: "[1,2,3]"

- For two arguments:

  input: "[1,2,3]\n5"

- For string arguments:

  input: "\"hello\""

- For two-dimensional arrays:

  input: "[[1,2],[3,4]]"

testCases.expected rules:

- Must be valid JSON.

- Must match exactly what console.log(JSON.stringify(result)) would output.

- Examples:

  expected: "true"

  expected: "false"

  expected: "null"

  expected: "5"

  expected: "[1,2,3]"

  expected: "\"hello\""

Test cases must cover:

- empty input when allowed

- single element when relevant

- all same values when relevant

- normal case

- edge case

- impossible/no-solution case when relevant

11. Hints:

Each problem must have exactly 4 hints.



Hint writing style:

- Friendly, encouraging, and lightly playful.

- Explain like a helpful mentor, not a textbook.

- Use scenario-flavored wording when it fits the problem theme.

- Keep hints useful and concrete.

- Do not reveal too much before tier 4.

- Avoid robotic phrases like "Use X because..." repeated too often.



Tier 1:

- Must hint toward the right data structure.

- This should feel like the first little lantern in the fog.

- Mention the likely data structure or helper variable.

- Examples:

  - "A tiny memory pouch would help here. Try using a Set to remember what you have already seen."

  - "This problem wants a counting notebook. A Map can track how often each item appears."

  - "Try keeping two pointers, one at each end, like two market guards moving inward."

  - "A running total is enough here. No need to bring a whole toolbox."



Tier 2:

- Must name the algorithm or pattern.

- Keep it clear and recognizable.

- Examples:

  - "Pattern: Two Sum with a hash set."

  - "Pattern: Fixed-size sliding window."

  - "Pattern: Variable-size sliding window with a frequency map."

  - "Algorithm: Kadane's algorithm."

  - "Pattern: Binary search on answer with greedy feasibility check."

  - "Pattern: House Robber dynamic programming."



Tier 3:

- Must provide step-by-step pseudocode.

- Write it like a recipe card: clear, ordered, and easy to follow.

- Do not include full JavaScript code yet.

- The steps should be detailed enough that a learner can implement them.

- Example:

  "Create an empty Set called seen.\nFor each value in the array:\n  Compute the value needed to reach the target.\n  If seen contains the needed value, return true.\n  Add the current value to seen.\nReturn false."

- Example:

  "Set left = 0 and best = 0.\nMove right through the array.\nAdd the new value into the frequency map.\nWhile the window breaks the rule, remove the left value and move left forward.\nUpdate best with the current window length.\nReturn best."



Tier 4:

- Must include the full working solution in JavaScript.

- Must use the exact functionName of the problem.

- Must pass all test cases.

- Must include time complexity and space complexity.

- Keep code clean, readable, and beginner-friendly.

- Example format:

  "Full working solution in JavaScript:\n\nfunction functionName(args) {\n  // working solution\n}\n\nTime complexity: O(n), where n is the input length.\nSpace complexity: O(1)."



When writing hints, lightly reflect the problem theme when natural.

For example, if the problem is about a food market, hints can mention baskets, stalls, or recipes.

If the problem is about music or festivals, hints can mention rhythm, spotlight, or procession.

Do not overdo the metaphor. Clarity comes first.

12. Algorithm quality:

- EASY problems should be solvable with simple traversal, counting, basic math, Set, or simple array logic.

- MEDIUM problems should use patterns like sliding window, hash map, two pointers, sorting + greedy, simple DP.

- HARD problems should use more advanced patterns like binary search on answer, monotonic queue, dynamic programming, graph traversal, trie, union find, heap, or backtracking.

13. Avoid duplication:

Do not create multiple problems that are basically the same algorithm with only different story names.

Vary both the theme and the algorithmic pattern.

14. JSON safety:

- Escape all newline characters inside strings as \n.

- Escape quotes inside strings if needed.

- Do not use trailing commas.

- Do not use undefined.

- Optional explanation should still be included as a string when possible.

- The final response must be a raw JSON array only.

Now generate:

- Number of problems: [NUMBER]

- Difficulty mix: [EASY_COUNT] EASY, [MEDIUM_COUNT] MEDIUM, [HARD_COUNT] HARD

- Main topic: [MAIN_TOPIC or "mixed topics"]

- Theme: [THEME]

15. Complexity requirements:
Each problem must clearly state the expected time and space complexity when the optimal solution is important.

If a brute-force solution would make the problem too easy, the description or constraints must explicitly require the intended complexity.

For MEDIUM and HARD problems:
- Include an "Expected complexity" line in the description when needed.
- The expected complexity must match the intended algorithm.
- Do not mark a problem as HARD if a simple brute-force or flatten-and-sort solution fully satisfies the requirements without violating complexity.

Examples:

For Merge k Sorted Lists:
The description should say:
"Your solution should run in **O(N log k)** time, where `N` is the total number of customers and `k` is the number of lists."

For Binary Search on Answer:
The description should say:
"Your solution should be more efficient than trying every possible capacity."

For Sliding Window:
The description should say:
"Your solution should run in **O(n)** time."

For Heap problems:
The description should make the heap requirement natural:
"Because the number of lists can be large, avoid flattening all values and sorting them again. Use the fact that each list is already sorted."

Difficulty and complexity alignment:
- EASY: usually `O(n)`, `O(1)` or simple `O(n)` extra space.
- MEDIUM: usually `O(n)`, `O(n log n)`, or simple DP/sliding window/hash map.
- HARD: should require a clearly optimal pattern such as `O(N log k)`, `O(n log S)`, `O(n)` with monotonic queue, advanced DP, heap, trie, graph traversal, or union find.

If the intended solution uses a specific complexity, include it in:
1. The description
2. The constraints or notes
3. Hint tier 2 or tier 3
4. Hint tier 4 complexity analysis

Do not create hidden difficulty.
The user should know from the problem statement when brute force is not enough.


```
