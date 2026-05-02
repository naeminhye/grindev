import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })  // ← must be before ALL other imports

import { PrismaClient, Difficulty, Topic } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { format, addDays } from "date-fns";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

const problems = [
  {
    id: "prob_two_sum",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: Difficulty.EASY,
    topic: Topic.HASH_MAP,
    description: `## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers that add up to \`target\`.

You may assume each input has exactly one solution, and you may not use the same element twice.

**Example 1**
\`\`\`
Input:  nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
\`\`\`

**Example 2**
\`\`\`
Input:  nums = [3, 2, 4], target = 6
Output: [1, 2]
\`\`\`

**Constraints**
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- Only one valid answer exists.`,
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // your solution here
}`,
    testCases: [
      { input: "[2,7,11,15]\n9", expected: "[0,1]" },
      { input: "[3,2,4]\n6", expected: "[1,2]" },
      { input: "[3,3]\n6", expected: "[0,1]" },
    ],
    hints: [
      {
        tier: 1,
        cost: 1,
        content:
          "Think about what data structure gives you O(1) lookups by value.",
      },
      {
        tier: 2,
        cost: 3,
        content:
          "Use a Hash Map. For each number, check if its complement (target - num) already exists in the map.",
      },
      {
        tier: 3,
        cost: 7,
        content:
          "Pseudocode:\n1. Create an empty map\n2. Loop through nums with index i\n3. complement = target - nums[i]\n4. If map has complement → return [map.get(complement), i]\n5. Else → map.set(nums[i], i)",
      },
      {
        tier: 4,
        cost: 15,
        content:
          "Full solution:\n```js\nfunction twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n}\n```\nTime: O(n) · Space: O(n)",
      },
    ],
  },
  {
    id: "prob_valid_parens",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: Difficulty.EASY,
    topic: Topic.STACK_QUEUE,
    description: `## Valid Parentheses

Given a string \`s\` containing only \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, determine if the input string is valid.

A string is valid if:
- Open brackets are closed by the same type of bracket
- Open brackets are closed in the correct order
- Every close bracket has a corresponding open bracket

**Example 1**
\`\`\`
Input:  s = "()"
Output: true
\`\`\`

**Example 2**
\`\`\`
Input:  s = "()[]{}"
Output: true
\`\`\`

**Example 3**
\`\`\`
Input:  s = "(]"
Output: false
\`\`\`

**Constraints**
- \`1 <= s.length <= 10^4\`
- \`s\` consists of brackets only`,
    starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // your solution here
}`,
    testCases: [
      { input: '"()"', expected: "true" },
      { input: '"()[]{}"', expected: "true" },
      { input: '"(]"', expected: "false" },
      { input: '"([)]"', expected: "false" },
      { input: '"{[]}"', expected: "true" },
    ],
    hints: [
      {
        tier: 1,
        cost: 1,
        content:
          'Think about which data structure is naturally suited for "last in, first out" matching.',
      },
      {
        tier: 2,
        cost: 3,
        content:
          "Use a Stack. Push open brackets, pop and compare when you see a closing bracket.",
      },
      {
        tier: 3,
        cost: 7,
        content:
          "Pseudocode:\n1. Create a stack and a map of closing→opening brackets\n2. For each char: if opening → push; if closing → pop and check match\n3. Return stack.length === 0",
      },
      {
        tier: 4,
        cost: 15,
        content:
          'Full solution:\n```js\nfunction isValid(s) {\n  const stack = [];\n  const map = { ")": "(", "}": "{", "]": "[" };\n  for (const c of s) {\n    if (!map[c]) { stack.push(c); continue; }\n    if (stack.pop() !== map[c]) return false;\n  }\n  return stack.length === 0;\n}\n```',
      },
    ],
  },
  {
    id: "prob_max_subarray",
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    difficulty: Difficulty.MEDIUM,
    topic: Topic.DYNAMIC_PROGRAMMING,
    description: `## Maximum Subarray

Given an integer array \`nums\`, find the subarray with the largest sum and return its sum.

**Example 1**
\`\`\`
Input:  nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: [4,-1,2,1] has the largest sum = 6
\`\`\`

**Example 2**
\`\`\`
Input:  nums = [1]
Output: 1
\`\`\`

**Constraints**
- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\``,
    starterCode: `/**
 * @param {number[]} nums
 * @return {number}
 */
function maxSubArray(nums) {
  // your solution here
}`,
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expected: "6" },
      { input: "[1]", expected: "1" },
      { input: "[5,4,-1,7,8]", expected: "23" },
      { input: "[-1]", expected: "-1" },
    ],
    hints: [
      {
        tier: 1,
        cost: 1,
        content:
          "At each position, you have two choices: extend the current subarray or start a new one.",
      },
      {
        tier: 2,
        cost: 3,
        content:
          "This is Kadane's Algorithm — a classic dynamic programming pattern.",
      },
      {
        tier: 3,
        cost: 7,
        content:
          "Pseudocode (Kadane's):\n1. currentSum = nums[0], maxSum = nums[0]\n2. For i from 1 to end:\n   currentSum = max(nums[i], currentSum + nums[i])\n   maxSum = max(maxSum, currentSum)\n3. Return maxSum",
      },
      {
        tier: 4,
        cost: 15,
        content:
          "Full solution:\n```js\nfunction maxSubArray(nums) {\n  let cur = nums[0], max = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    cur = Math.max(nums[i], cur + nums[i]);\n    max = Math.max(max, cur);\n  }\n  return max;\n}\n```\nTime: O(n) · Space: O(1)",
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding problems...");

  for (const p of problems) {
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
    console.log(`  ✓ ${p.title}`);
  }

  const today = new Date();
  for (let i = 0; i < problems.length; i++) {
    const date = format(addDays(today, i), "yyyy-MM-dd");
    await prisma.dailyProblem.upsert({
      where: { date },
      update: {},
      create: { date, problemId: problems[i].id },
    });
    console.log(`  📅 ${date} → ${problems[i].title}`);
  }

  console.log("✅ Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
