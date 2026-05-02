const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";
const HEADERS = {
  "Content-Type": "application/json",
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  "X-RapidAPI-Key": process.env.JUDGE0_API_KEY!,
};

// Judge0 language IDs
const LANGUAGE_IDS: Record<string, number> = {
  javascript: 93, // Node.js 18
  typescript: 74,
  python: 71, // Python 3
  java: 62,
  cpp: 54,
};

export type ExecutionResult = {
  stdout: string;
  stderr: string;
  status: string;
};

export async function runCode(
  language: string,
  code: string,
  stdin = "",
): Promise<ExecutionResult> {
  const languageId = LANGUAGE_IDS[language] ?? LANGUAGE_IDS["javascript"];

  // Submit
  const submitRes = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin,
        cpu_time_limit: 5,
        memory_limit: 128000,
      }),
    },
  );

  const data = await submitRes.json();

  return {
    stdout: data.stdout ?? "",
    stderr: data.stderr ?? data.compile_output ?? "",
    status: data.status?.description ?? "Unknown",
  };
}

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_IDS);
