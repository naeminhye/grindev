import { NextResponse } from "next/server";
import { getAdminUserId } from "@/lib/admin-auth";

const TEMPLATE = {
  title: "My Quiz Title",
  topic: "JAVASCRIPT",
  difficulty: "EASY",
  questions: [
    {
      question: "What is the output of typeof null?",
      options: ['"null"', '"object"', '"undefined"', "null"],
      correctIndex: 1,
      explanation:
        'typeof null returns "object" due to a historical bug in JavaScript.',
    },
    {
      question: "What does the following code log?",
      code: "const arr = [1, 2, 3];\nconsole.log(arr[5]);",
      options: ["null", "0", "undefined", "Error"],
      correctIndex: 2,
      explanation:
        "Accessing an array index that doesn't exist returns undefined, not null or an error.",
    },
  ],
};

export async function GET() {
  const { error } = await getAdminUserId();
  if (error) return error;

  return new NextResponse(JSON.stringify(TEMPLATE, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="quiz-template.json"',
    },
  });
}
